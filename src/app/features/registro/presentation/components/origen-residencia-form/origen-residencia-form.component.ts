import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
@Component({selector:'app-origen-residencia-form',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./origen-residencia-form.component.html',styleUrl:'../form-sections.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class OrigenResidenciaFormComponent { readonly form=input.required<FormGroup>(); }
