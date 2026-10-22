import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KardexFlowService } from '../../core/navigation/kardex-flow.service';
import { GetCurrentSessionUseCase } from '../auth/application/get-current-session.use-case';
import { SignOutUseCase } from '../auth/application/sign-out.use-case';
import { RegistroDraft } from '../registro/domain/models/registro.model';
import { HttpRegistroRepository } from '../registro/infrastructure/http-registro.repository';
import { LocalStorageRegistroRepository } from '../registro/infrastructure/local-storage-registro.repository';
import { InstitutionalHeaderComponent } from '../../shared/layout/institutional-header/institutional-header.component';
import { SidebarComponent } from '../../shared/layout/sidebar/sidebar.component';
import { SectionHeaderComponent } from '../../shared/ui/section-header/section-header.component';

@Component({
  selector: 'app-consulta-page', standalone: true,
  imports: [InstitutionalHeaderComponent, SidebarComponent, SectionHeaderComponent, RouterLink],
  templateUrl: './consulta-page.component.html', styleUrl: './flow-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultaPageComponent implements OnInit {
  private readonly repository = inject(HttpRegistroRepository);
  private readonly local = inject(LocalStorageRegistroRepository);
  private readonly flow = inject(KardexFlowService);
  private readonly router = inject(Router);
  private readonly signOutUseCase = inject(SignOutUseCase);
  readonly session = inject(GetCurrentSessionUseCase).execute();
  readonly sidebarOpen = signal(typeof window !== 'undefined' && window.innerWidth > 900);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly query = signal('');
  readonly draft = signal<RegistroDraft | null>(null);
  readonly filtered = computed(() => {
    const person = this.draft();
    if (!person || !this.flow.isProfileValidated(person.curp)) return null;
    const term = this.query().trim().toLocaleUpperCase('es-MX');
    const haystack = [person.curp, person.cuip, person.numeroNomina, person.nombres, person.primerApellido, person.segundoApellido].join(' ').toLocaleUpperCase('es-MX');
    return !term || haystack.includes(term) ? person : null;
  });

  async ngOnInit(): Promise<void> {
    try { this.draft.set(await this.repository.loadDraft()); }
    catch {
      this.error.set('No fue posible recuperar la información del servidor. Se muestran los datos locales disponibles.');
      this.draft.set(await this.local.loadDraft());
    } finally { this.loading.set(false); }
  }

  onSearch(event: Event): void { this.query.set((event.target as HTMLInputElement).value); }
  async selectProfile(): Promise<void> {
    const person = this.filtered();
    if (!person || !this.flow.selectProfile(person.curp)) return;
    await this.router.navigateByUrl('/menu');
  }
  toggleSidebar(): void { this.sidebarOpen.update(open => !open); }
  closeMobileSidebar(): void { if (typeof window !== 'undefined' && window.innerWidth <= 900) this.sidebarOpen.set(false); }
  async logout(): Promise<void> {
    this.flow.clear();
    try { await this.signOutUseCase.execute(); } finally { await this.router.navigateByUrl('/login'); }
  }
}
