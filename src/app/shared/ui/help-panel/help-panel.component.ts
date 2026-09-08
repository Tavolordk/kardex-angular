import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ASSETS } from '../../../core/constants/assets';
import { SectionProgress } from '../../../features/registro/domain/models/registro-step.model';

@Component({ selector:'app-help-panel', standalone:true, templateUrl:'./help-panel.component.html', styleUrl:'./help-panel.component.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class HelpPanelComponent {
  readonly sections=input.required<SectionProgress[]>();
  readonly general=input.required<number>();
  readonly assets=ASSETS;
}
