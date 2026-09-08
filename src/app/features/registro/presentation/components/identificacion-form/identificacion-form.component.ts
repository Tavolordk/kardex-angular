import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
@Component({selector:'app-identificacion-form',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./identificacion-form.component.html',styleUrl:'../form-sections.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class IdentificacionFormComponent { readonly form=input.required<FormGroup>(); }
