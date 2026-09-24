import { HttpContextToken } from '@angular/common/http';

export const WITH_CREDENTIALS = new HttpContextToken<boolean>(() => false);
