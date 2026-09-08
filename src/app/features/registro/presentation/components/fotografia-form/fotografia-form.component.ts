import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ASSETS } from '../../../../../core/constants/assets';
@Component({selector:'app-fotografia-form',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./fotografia-form.component.html',styleUrl:'./fotografia-form.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class FotografiaFormComponent {
  readonly form=input.required<FormGroup>(); readonly photoUrl=input(''); readonly photoName=input(''); readonly photoError=input('');
  readonly photoSelected=output<File>(); readonly photoRemoved=output<void>(); readonly assets=ASSETS;
  onFile(event:Event):void{const inputEl=event.target as HTMLInputElement; const file=inputEl.files?.[0]; if(file)this.photoSelected.emit(file); inputEl.value='';}
}
