import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
@Component({selector:'app-contacto-form',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./contacto-form.component.html',styleUrl:'../form-sections.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class ContactoFormComponent { readonly form=input.required<FormGroup>(); }
