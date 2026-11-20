export type ActiveFlag = 'Y' | 'N';

/** Entidad que regresa la API (GET /catalogos/people) */
export interface Person {
  personId?: number;
  fullName: string;
  email?: string | null;
  organization?: string | null;
  isActive: ActiveFlag;
}
