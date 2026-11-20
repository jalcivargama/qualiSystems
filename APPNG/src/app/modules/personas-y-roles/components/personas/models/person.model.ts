export type ActiveFlag = 'Y' | 'N';

/** Entidad que regresa la API */
export interface Person {
  personId?: number;
  fullName: string;
  email?: string | null;
  organization?: string | null;
  isActive: ActiveFlag;
}

/** Body para CREATE (sin personId) */
export type PersonRequest = Omit<Person, 'personId'>;
