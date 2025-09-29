// src/app/shared/pipes/badge-si-no.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { badgeSiNo } from '@shared/utils/strings/boolean.util';

@Pipe({ name: 'badgeSiNo', standalone: true, pure: true })
export class BadgeSiNoPipe implements PipeTransform {
  transform(v: any): 'Sí' | 'No' {
    return badgeSiNo(v);
  }
}
