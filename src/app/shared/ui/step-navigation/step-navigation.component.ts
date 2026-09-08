import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RegistroStepKey } from '../../../features/registro/domain/models/registro.model';
import { RegistroStep } from '../../../features/registro/domain/models/registro-step.model';

@Component({ selector:'app-step-navigation', standalone:true, templateUrl:'./step-navigation.component.html', styleUrl:'./step-navigation.component.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class StepNavigationComponent {
  readonly steps=input.required<RegistroStep[]>();
  readonly active=input.required<RegistroStepKey>();
  readonly completed=input.required<Record<RegistroStepKey, boolean>>();
  readonly changed=output<RegistroStepKey>();
  status(step: RegistroStep): string { if(step.key===this.active()) return 'En captura'; return this.completed()[step.key] ? 'Capturado':'Disponible'; }
}
