import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
@Component({selector:'app-origen-residencia-form',standalone:true,imports:[ReactiveFormsModule, InputCaseDirective],templateUrl:'./origen-residencia-form.component.html',styleUrl:'../form-sections.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class OrigenResidenciaFormComponent { readonly form=input.required<FormGroup>(); }
