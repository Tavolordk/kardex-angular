import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { HelperPanelDockItem, HelperPanelKey } from '../helper-panel.model';

@Component({
  selector: 'app-utility-dock',
  standalone: true,
  templateUrl: './utility-dock.component.html',
  styleUrl: './utility-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilityDockComponent {
  readonly items = input.required<HelperPanelDockItem[]>();
  readonly toggled = output<HelperPanelKey>();
  readonly expanded = signal(false);

  toggleDock(): void {
    this.expanded.update(value => !value);
  }

  togglePanel(key: HelperPanelKey): void {
    this.toggled.emit(key);
  }
}
