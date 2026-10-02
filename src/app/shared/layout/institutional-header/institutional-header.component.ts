import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ASSETS } from '../../../core/constants/assets';

@Component({
  selector: 'app-institutional-header',
  standalone: true,
  templateUrl: './institutional-header.component.html',
  styleUrl: './institutional-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstitutionalHeaderComponent {
  @Input() displayName = 'Administrador Kardex';
  @Input() role = 'Administrador';
  @Output() readonly logoutRequested = new EventEmitter<void>();

  readonly assets = ASSETS;

  get initials(): string {
    return this.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'AK';
  }
}
