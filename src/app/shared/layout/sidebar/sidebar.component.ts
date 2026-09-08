import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ASSETS } from '../../../core/constants/assets';

interface MenuItem { title: string; description: string; icon: string; active?: boolean; }

@Component({ selector: 'app-sidebar', standalone: true, templateUrl: './sidebar.component.html', styleUrl: './sidebar.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SidebarComponent {
  readonly open = input(true);
  readonly toggled = output<void>();
  readonly assets = ASSETS;
  readonly items: MenuItem[] = [
    { title: 'Tablero principal', description: 'Resumen general', icon: ASSETS.icons.dashboard },
    { title: 'Consolidación RNPSP', description: 'Importación y validación', icon: ASSETS.icons.consolidation },
    { title: 'Registro', description: 'Captura inicial', icon: ASSETS.icons.registro, active: true },
    { title: 'Consulta', description: 'Búsqueda de personal', icon: ASSETS.icons.search },
    { title: 'Administración', description: 'Usuarios y permisos', icon: ASSETS.icons.administration }
  ];
}
