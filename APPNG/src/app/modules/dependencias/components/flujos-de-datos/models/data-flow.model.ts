export type Sensitivity = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

/** Entidad que regresa la API (GET /catalogos/data-flows) */
export interface DataFlow {
  dataFlowId?: number;
  dependencyId: number;
  dataName: string;
  periodicity?: string | null;
  sensitivity?: Sensitivity | null;
  dataFormat?: string | null;
  description?: string | null;
}
