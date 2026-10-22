import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KardexFlowService } from '../../core/navigation/kardex-flow.service';
import { InitialReviewSection, reviewInitialRegistration } from '../../core/navigation/initial-review';
import { GetCurrentSessionUseCase } from '../auth/application/get-current-session.use-case';
import { SignOutUseCase } from '../auth/application/sign-out.use-case';
import { RegistroDraft } from '../registro/domain/models/registro.model';
import { HttpRegistroRepository } from '../registro/infrastructure/http-registro.repository';
import { LocalStorageRegistroRepository } from '../registro/infrastructure/local-storage-registro.repository';
import { InstitutionalHeaderComponent } from '../../shared/layout/institutional-header/institutional-header.component';
import { SidebarComponent } from '../../shared/layout/sidebar/sidebar.component';
import { SectionHeaderComponent } from '../../shared/ui/section-header/section-header.component';

@Component({
  selector: 'app-initial-validation-page', standalone: true,
  imports: [InstitutionalHeaderComponent, SidebarComponent, SectionHeaderComponent, RouterLink],
  templateUrl: './initial-validation-page.component.html',
  styleUrl: './flow-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitialValidationPageComponent implements OnInit {
  private readonly repository = inject(HttpRegistroRepository);
  private readonly local = inject(LocalStorageRegistroRepository);
  private readonly router = inject(Router);
  private readonly flow = inject(KardexFlowService);
  private readonly signOutUseCase = inject(SignOutUseCase);
  readonly session = inject(GetCurrentSessionUseCase).execute();
  readonly sidebarOpen = signal(typeof window !== 'undefined' && window.innerWidth > 900);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly draft = signal<RegistroDraft | null>(null);
  readonly sections = signal<InitialReviewSection[]>([]);
  readonly complete = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const draft = await this.repository.loadDraft();
      this.setDraft(draft);
    } catch {
      // La API puede estar indisponible: se muestra una advertencia y el borrador real local.
      this.error.set('No se pudo recuperar la información del servidor. Revisa el borrador local antes de continuar.');
      this.setDraft(await this.local.loadDraft());
    } finally { this.loading.set(false); }
  }

  private setDraft(draft: RegistroDraft | null): void {
    this.draft.set(draft);
    const sections = draft ? reviewInitialRegistration(draft) : [];
    this.sections.set(sections);
    this.complete.set(sections.length > 0 && sections.every(section => section.complete));
  }

  async confirm(): Promise<void> {
    const draft = this.draft();
    if (!draft || !this.complete() || !draft.curp.trim()) return;
    this.flow.confirmInitialReview(draft.curp);
    await this.router.navigateByUrl('/consulta');
  }

  toggleSidebar(): void { this.sidebarOpen.update(open => !open); }
  closeMobileSidebar(): void { if (typeof window !== 'undefined' && window.innerWidth <= 900) this.sidebarOpen.set(false); }
  async logout(): Promise<void> {
    this.flow.clear();
    try { await this.signOutUseCase.execute(); } finally { await this.router.navigateByUrl('/login'); }
  }
}
