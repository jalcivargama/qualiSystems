export type DependencyScope = 'INTERNAL' | 'EXTERNAL';

export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Entidad que regresa la API */
export interface Dependency {
  dependencyId?: number;
  originComponentId: number;
  targetComponentId: number;
  dependencyTypeId: number;
  dependencyScope: DependencyScope;
  criticality?: Criticality | null;
  description?: string | null;
  createdAt?: string;
}

/** Body para CREATE (sin campos de solo lectura) */
export type DependencyRequest = Omit<Dependency, 'dependencyId' | 'createdAt'>;
