import { UserRole } from '../../core/models/user-info.model';

/** Odpowiedź z `GET /user/all` (panel admina). */
export interface UserAdmin {
  userName: string;
  role: UserRole;
  savedTime?: string | null;
}
