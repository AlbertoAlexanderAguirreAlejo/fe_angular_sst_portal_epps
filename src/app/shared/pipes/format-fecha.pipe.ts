// src/app/shared/pipes/format-fecha.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { formatFecha } from '@shared/utils/date/date.util';

@Pipe({ name: 'formatFecha', standalone: true, pure: true })
export class FormatFechaPipe implements PipeTransform {
  transform(
    value?: string | Date | null,
    timeZone: string = 'UTC',
    pattern: string = 'dd/MM/yyyy, HH:mm',
    locale: string | string[] = 'es-PE'
  ): string {
    return formatFecha(value ?? undefined, timeZone, pattern, locale);
  }
}
