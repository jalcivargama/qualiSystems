export type TechnologyCategory =
  | 'LANGUAGE'
  | 'FRAMEWORK'
  | 'DATABASE'
  | 'FRONTEND'
  | 'BACKEND'
  | 'MESSAGING'
  | 'CONTAINER'
  | 'ORCHESTRATION'
  | 'MONITORING'
  | 'OTHER';

/** Entidad que regresa la API */
export interface Technology {
  technologyId?: number;
  category: TechnologyCategory;
  name: string;
}

/** Body para CREATE (sin technologyId) */
export type TechnologyRequest = Omit<Technology, 'technologyId'>;
