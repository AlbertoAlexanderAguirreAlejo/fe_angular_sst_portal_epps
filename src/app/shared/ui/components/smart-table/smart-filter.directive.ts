import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[smartFilter]',
  standalone: true,
})
export class SmartFilterDef {
  @Input('smartFilter') field!: string;
  constructor(public tpl: TemplateRef<any>) {}
}
