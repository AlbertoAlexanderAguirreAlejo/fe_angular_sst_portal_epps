// core/services/network/network.tokens.ts
import { HttpContextToken } from '@angular/common/http';

export const TRACK_LOADING = new HttpContextToken<boolean>(() => true);
export const REQUEST_LABEL = new HttpContextToken<string | null>(() => null);
export const REQUEST_ID    = new HttpContextToken<string | null>(() => null);
