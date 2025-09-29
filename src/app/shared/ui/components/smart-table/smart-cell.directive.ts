import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[smartCell]',
  standalone: true,
})
export class SmartCellDef {
  @Input('smartCell') key!: string;
  constructor(public tpl: TemplateRef<any>) {}
}
