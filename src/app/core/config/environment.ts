import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export const ApiUrl = new InjectionToken<string>('ApiUrl', {
  providedIn: 'root',
  factory: () => environment.apiUrl
});
