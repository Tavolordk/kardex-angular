import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly open = input(true);
  readonly toggled = output<void>();
  readonly assets = ASSETS;
  // Figma 731:679: únicamente tres módulos. Consulta y Administración aún no
  // tienen rutas ni funcionalidades; se representan deshabilitados, no simulados.
  readonly items: readonly MenuItem[] = [
    { title: 'Registro', description: 'Captura inicial', icon: ASSETS.icons.registro, path: '/menu' },
    { title: 'Consulta', description: 'Búsqueda de personal', icon: ASSETS.icons.search },
    { title: 'Administración', description: 'Usuarios y permisos', icon: ASSETS.icons.administration }
  ];
}
