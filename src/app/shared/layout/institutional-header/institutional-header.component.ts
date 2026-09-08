import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ASSETS } from '../../../core/constants/assets';

@Component({
  selector: 'app-institutional-header',
  standalone: true,
  templateUrl: './institutional-header.component.html',
  styleUrl: './institutional-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstitutionalHeaderComponent {
  readonly assets = ASSETS;
}
