import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ASSETS } from '../../../core/constants/assets';

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  path?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly open = input(true);
  readonly toggled = output<void>();
  readonly assets = ASSETS;
  // Figma conserva tres módulos. Administración permanece deshabilitada: no hay endpoint provisto.
  readonly items: readonly MenuItem[] = [
    { title: 'Registro', description: 'Captura inicial', icon: ASSETS.icons.registro, path: '/registro' },
    { title: 'Consulta', description: 'Búsqueda de personal', icon: ASSETS.icons.search, path: '/consulta' },
    { title: 'Administración', description: 'Usuarios y permisos', icon: ASSETS.icons.administration }
  ];
}
