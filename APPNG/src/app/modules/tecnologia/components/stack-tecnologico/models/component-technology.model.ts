export type ActiveFlag = 'Y' | 'N';

/** Entidad que regresa la API */
export interface ComponentTechnology {
  componentId: number;
  technologyId: number;
  version?: string | null;
  isPrimary: ActiveFlag;
}

/** Body para UPDATE (clave va en la URL) */
export type ComponentTechnologyUpdateRequest = Omit<
  ComponentTechnology,
  'componentId' | 'technologyId'
>;
