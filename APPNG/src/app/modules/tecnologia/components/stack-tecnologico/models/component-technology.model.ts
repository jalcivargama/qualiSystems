export type ActiveFlag = 'Y' | 'N';

/** Entidad que regresa la API */
export interface ComponentTechnology {
  componentId: number;
  technologyId: number;
  version?: string | null;
  isPrimary: ActiveFlag;
}
