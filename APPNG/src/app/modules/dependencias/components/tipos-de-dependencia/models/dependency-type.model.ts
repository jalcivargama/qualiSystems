/** Entidad que regresa la API */
export interface DependencyType {
  dependencyTypeId?: number;
  typeCode: string;
  typeName: string;
}

/** Body para CREATE (sin dependencyTypeId) */
export type DependencyTypeRequest = Omit<DependencyType, 'dependencyTypeId'>;
