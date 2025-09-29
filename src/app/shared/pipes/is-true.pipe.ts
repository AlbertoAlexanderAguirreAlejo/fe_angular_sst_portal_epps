// src/app/shared/pipes/is-true.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { isTrue } from '@shared/utils/strings/boolean.util';

@Pipe({ name: 'isTrue', standalone: true, pure: true })
export class IsTruePipe implements PipeTransform {
  transform(v: any): boolean {
    return isTrue(v);
  }
}
