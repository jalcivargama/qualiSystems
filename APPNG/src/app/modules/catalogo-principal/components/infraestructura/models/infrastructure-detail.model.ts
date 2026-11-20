export type HostingModel = 'CLOUD' | 'ON_PREMISE';

/** Entidad que regresa la API */
export interface InfrastructureDetail {
  componentId: number;
  componentType?: 'INFRASTRUCTURE';
  hostname?: string | null;
  ipAddress?: string | null;
  operatingSystem?: string | null;
  hostingModel?: HostingModel | null;
}

/** Body para CREATE (sin componentType) */
export type InfrastructureDetailRequest = Omit<InfrastructureDetail, 'componentType'>;
