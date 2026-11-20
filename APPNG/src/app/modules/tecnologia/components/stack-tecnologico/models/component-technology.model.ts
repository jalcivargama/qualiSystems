export type ActiveFlag = 'Y' | 'N';

/** Entidad que regresa la API (GET /catalogos/component-technologies) */
export interface ComponentTechnology {
  componentId: number;
  technologyId: number;
  version?: string | null;
  isPrimary: ActiveFlag;
}
