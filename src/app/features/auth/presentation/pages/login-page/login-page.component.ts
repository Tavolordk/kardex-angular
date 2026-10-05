import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestVerificationUseCase } from '../../../application/request-verification.use-case';
import { VerifyAccessCodeUseCase } from '../../../application/verify-access-code.use-case';
import { AccessCredentials, VerificationChallenge, VerificationChannel } from '../../../domain/models/auth.model';
import { ASSETS } from '../../../../../core/constants/assets';
import { AnimatedWaveBackgroundComponent } from '../../../../../shared/ui/animated-wave-background/animated-wave-background.component';

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
  imports: [ReactiveFormsModule, AnimatedWaveBackgroundComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly requestVerification = inject(RequestVerificationUseCase);
  private readonly verifyAccessCode = inject(VerifyAccessCodeUseCase);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private timerId: number | null = null;
  private lastCredentials: AccessCredentials | null = null;

  @ViewChildren('codeInput') private codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly assets = ASSETS;
  readonly step = signal<LoginStep>('credentials');
  readonly captchaCode = signal('7K3F9Q');
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
    captcha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  readonly verificationForm = this.fb.group({
    d1: ['4', [Validators.required, Validators.pattern(/^\d$/)]],
    d2: ['8', [Validators.required, Validators.pattern(/^\d$/)]],
    d3: ['1', [Validators.required, Validators.pattern(/^\d$/)]],
    d4: ['0', [Validators.required, Validators.pattern(/^\d$/)]],
    d5: ['2', [Validators.required, Validators.pattern(/^\d$/)]],
    d6: ['7', [Validators.required, Validators.pattern(/^\d$/)]]
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.stopTimer());
    this.applyChannelRules(this.credentialsForm.controls.channel.value);
  }

  currentChannel(): VerificationChannel {
    return this.credentialsForm.controls.channel.value;
  }


  async submitCredentials(): Promise<void> {
    this.errorMessage.set('');
    this.credentialsForm.markAllAsTouched();

    if (this.credentialsForm.invalid) return;

    const captcha = this.credentialsForm.controls.captcha.value.trim().toUpperCase();
    if (captcha !== this.captchaCode()) {
      this.credentialsForm.controls.captcha.setErrors({ invalidCaptcha: true });
      this.errorMessage.set('El código captcha no coincide.');
      return;
    }

    const value = this.credentialsForm.getRawValue();
    const credentials: AccessCredentials = {
      email: value.email,
      phone: value.phone,
      channel: value.channel
    };

    this.busy.set(true);
    try {
      const challenge = await this.requestVerification.execute(credentials);
      this.lastCredentials = credentials;
      this.challenge.set(challenge);
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
      this.secondsRemaining.set(challenge.ttlSeconds);
      this.startTimer(challenge.expiresAt);
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible reenviar el código.'));
    } finally {
      this.busy.set(false);
    }
  }

  refreshCaptcha(): void {
    this.captchaCode.set(this.generateCaptcha());
    this.credentialsForm.controls.captcha.setValue('');
    this.credentialsForm.controls.captcha.setErrors(null);
    this.errorMessage.set('');
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

  private generateCaptcha(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const values = new Uint32Array(6);
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      crypto.getRandomValues(values);
    } else {
      values.forEach((_value, index) => values[index] = Math.floor(Math.random() * alphabet.length));
    }
    return Array.from(values, value => alphabet[value % alphabet.length]).join('');
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
