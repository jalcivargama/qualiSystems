export type Environment =
  | 'DEVELOPMENT'
  | 'TEST'
  | 'QA'
  | 'STAGING'
  | 'PRODUCTION'
  | 'DR';

/** Entidad que regresa la API */
export interface SystemDeployment {
  deploymentId?: number;
  componentId: number;
  environment: Environment;
  url?: string | null;
}

/** Body para CREATE (sin deploymentId) */
export type SystemDeploymentRequest = Omit<SystemDeployment, 'deploymentId'>;

/** Body para UPDATE (sin deploymentId; el id va en la URL) */
export type SystemDeploymentUpdateRequest = Omit<SystemDeployment, 'deploymentId'>;
