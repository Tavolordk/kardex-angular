import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestVerificationUseCase } from '../../../application/request-verification.use-case';
import { VerifyAccessCodeUseCase } from '../../../application/verify-access-code.use-case';
import { AccessCredentials, VerificationChallenge, VerificationChannel } from '../../../domain/models/auth.model';
import { ASSETS } from '../../../../../core/constants/assets';
import { AnimatedWaveBackgroundComponent } from '../../../../../shared/ui/animated-wave-background/animated-wave-background.component';
import { CaptchaService } from '../../../infrastructure/captcha.service';

type LoginStep = 'credentials' | 'verification';
type CodeControlName = 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6';

interface VerificationOption {
  value: VerificationChannel;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, AnimatedWaveBackgroundComponent, InputCaseDirective],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly requestVerification = inject(RequestVerificationUseCase);
  private readonly verifyAccessCode = inject(VerifyAccessCodeUseCase);
  private readonly captchaService = inject(CaptchaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private timerId: number | null = null;
  private lastCredentials: AccessCredentials | null = null;

  @ViewChildren('codeInput') private codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly assets = ASSETS;
  readonly step = signal<LoginStep>('credentials');
  readonly captchaId = signal('');
  readonly captchaImage = signal('');
  readonly captchaToken = signal<string | null>(null);
  readonly captchaLoading = signal(false);
  readonly challenge = signal<VerificationChallenge | null>(null);
  readonly secondsRemaining = signal(120);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly codeControlNames: readonly CodeControlName[] = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];

  readonly verificationOptions: readonly VerificationOption[] = [
    { value: 'telegram', label: 'Telegram', icon: ASSETS.icons.telegram },
    { value: 'email', label: 'Correo electrónico', icon: ASSETS.icons.mail },
    { value: 'sms', label: 'Mensaje SMS', icon: ASSETS.icons.sms }
  ];

  readonly credentialsForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    channel: this.fb.control<VerificationChannel>('email', Validators.required),
    captcha: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^[A-Z0-9]{5}$/)]]
  });

  readonly verificationForm = this.fb.group({
    d1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d6: ['', [Validators.required, Validators.pattern(/^\d$/)]]
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.stopTimer());
    this.applyChannelRules(this.credentialsForm.controls.channel.value);
    void this.refreshCaptcha();
  }

  currentChannel(): VerificationChannel {
    return this.credentialsForm.controls.channel.value;
  }


  async submitCredentials(): Promise<void> {
    this.errorMessage.set('');
    this.credentialsForm.markAllAsTouched();

    if (this.credentialsForm.invalid) return;

    const captchaId = this.captchaId();
    const captchaAnswer = this.credentialsForm.controls.captcha.value.trim().toUpperCase();
    if (!captchaId || !/^[A-Z0-9]{5}$/.test(captchaAnswer)) {
      this.credentialsForm.controls.captcha.setErrors({ invalidCaptcha: true });
      this.errorMessage.set('El captcha debe contener exactamente 5 caracteres alfanuméricos.');
      return;
    }

    const value = this.credentialsForm.getRawValue();
    const credentials: AccessCredentials = {
      email: value.email.trim().toLowerCase(),
      phone: value.phone,
      channel: value.channel
    };

    this.busy.set(true);
    try {
      const captchaValidation = await this.captchaService.validar(captchaId, captchaAnswer);
      if (!captchaValidation.ok) {
        this.credentialsForm.controls.captcha.setErrors({ invalidCaptcha: true });
        this.errorMessage.set('El código captcha no coincide.');
        await this.refreshCaptcha(false);
        return;
      }
      this.captchaToken.set(captchaValidation.token);

      const challenge = await this.requestVerification.execute(credentials);
      this.lastCredentials = credentials;
      this.challenge.set(challenge);
      this.verificationForm.reset({ d1: '', d2: '', d3: '', d4: '', d5: '', d6: '' });
      this.step.set('verification');
      this.secondsRemaining.set(challenge.ttlSeconds);
      this.startTimer(challenge.expiresAt);
      window.setTimeout(() => this.codeInputs.first?.nativeElement.focus(), 0);
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible solicitar el código de verificación.'));
    } finally {
      this.busy.set(false);
    }
  }

  async submitVerification(): Promise<void> {
    this.errorMessage.set('');
    this.verificationForm.markAllAsTouched();
    const challenge = this.challenge();

    if (!challenge || this.verificationForm.invalid) return;

    const code = this.codeControlNames
      .map(name => this.verificationForm.controls[name].value)
      .join('');

    this.busy.set(true);
    try {
      await this.verifyAccessCode.execute(challenge.id, code);
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible verificar el código.'));
    } finally {
      this.busy.set(false);
    }
  }

  async resendCode(): Promise<void> {
    if (!this.lastCredentials || this.busy()) return;

    this.errorMessage.set('');
    this.busy.set(true);
    try {
      const challenge = await this.requestVerification.execute(this.lastCredentials);
      this.challenge.set(challenge);
      this.verificationForm.reset({ d1: '', d2: '', d3: '', d4: '', d5: '', d6: '' });
      this.secondsRemaining.set(challenge.ttlSeconds);
      this.startTimer(challenge.expiresAt);
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible reenviar el código.'));
    } finally {
      this.busy.set(false);
    }
  }

  async refreshCaptcha(clearError = true): Promise<void> {
    if (this.captchaLoading()) return;
    this.captchaLoading.set(true);
    this.captchaToken.set(null);
    this.credentialsForm.controls.captcha.setValue('');
    this.credentialsForm.controls.captcha.setErrors(null);
    if (clearError) this.errorMessage.set('');

    try {
      const captcha = await this.captchaService.generar();
      this.captchaId.set(captcha.id);
      this.captchaImage.set(captcha.imageSrc);
    } catch (error) {
      this.captchaId.set('');
      this.captchaImage.set('');
      this.errorMessage.set(this.errorText(error, 'No fue posible generar el captcha.'));
    } finally {
      this.captchaLoading.set(false);
    }
  }

  selectChannel(channel: VerificationChannel): void {
    this.credentialsForm.controls.channel.setValue(channel);
    this.applyChannelRules(channel);
  }

  private applyChannelRules(_channel: VerificationChannel): void {
    const emailControl = this.credentialsForm.controls.email;
    const phoneControl = this.credentialsForm.controls.phone;
    emailControl.setValidators([Validators.required, Validators.email]);
    phoneControl.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]);
    emailControl.updateValueAndValidity({ emitEvent: false });
    phoneControl.updateValueAndValidity({ emitEvent: false });
  }

  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    const controlName = this.codeControlNames[index];
    if (!controlName) return;

    this.verificationForm.controls[controlName].setValue(digit);
    input.value = digit;

    if (digit && index < this.codeControlNames.length - 1) {
      this.codeInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  onCodeKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace') return;
    const input = event.target as HTMLInputElement;
    if (!input.value && index > 0) {
      this.codeInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  formatTimer(): string {
    const seconds = Math.max(0, this.secondsRemaining());
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  destinationText(): string {
    const challenge = this.challenge();
    if (!challenge) return '';
    if (challenge.channel === 'telegram') return `tu cuenta de Telegram asociada a ${challenge.destinationHint}`;
    if (challenge.channel === 'sms') return `el número ${challenge.destinationHint}`;
    return challenge.destinationHint;
  }

  private safeReturnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/registro';
  }

  private startTimer(expiresAt: string): void {
    this.stopTimer();
    const update = () => {
      const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      this.secondsRemaining.set(remaining);
      if (remaining === 0) this.stopTimer();
    };
    update();
    this.timerId = window.setInterval(update, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
