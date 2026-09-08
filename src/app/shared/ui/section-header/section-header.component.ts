import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ASSETS } from '../../../core/constants/assets';
@Component({ selector:'app-section-header', standalone:true, templateUrl:'./section-header.component.html', styleUrl:'./section-header.component.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class SectionHeaderComponent { readonly title=input('Datos personales'); readonly assets=ASSETS; }
