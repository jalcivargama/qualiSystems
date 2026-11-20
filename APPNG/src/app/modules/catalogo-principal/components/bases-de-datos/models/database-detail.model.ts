/** Entidad que regresa la API */
export interface DatabaseDetail {
  componentId: number;
  componentType?: 'DATABASE';
  engine: string;
  engineVersion?: string | null;
  instanceName?: string | null;
  schemaName?: string | null;
}

/** Body para CREATE (sin componentType) */
export type DatabaseDetailRequest = Omit<DatabaseDetail, 'componentType'>;
