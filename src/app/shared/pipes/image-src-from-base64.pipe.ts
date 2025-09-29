// src/app/shared/pipes/image-src-from-base64.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { imageSrcFromBase64 } from '@shared/utils/files/base64.util';

@Pipe({ name: 'imageSrcFromBase64', standalone: true, pure: true })
export class ImageSrcFromBase64Pipe implements PipeTransform {
  transform(b64?: string | null): string {
    return imageSrcFromBase64(b64 ?? undefined);
  }
}
