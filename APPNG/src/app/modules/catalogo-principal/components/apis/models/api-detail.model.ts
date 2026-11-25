/** Entidad que regresa la API */
export interface ApiDetail {
  componentId: number;
  componentType?: 'API';
  apiVersion?: string | null;
  url?: string | null;
  urlDoc?: string | null;
  /** Fecha opcional YYYY-MM-DD */
  certificateValidity?: string | null;
  protocol?: string | null;
  authenticationMethod?: string | null;
  slaDescription?: string | null;
}

/** Body para CREATE (sin componentType) */
export type ApiDetailRequest = Omit<ApiDetail, 'componentType'>;

/** Body para UPDATE (sin componentType) */
export type ApiDetailUpdateRequest = Omit<ApiDetail, 'componentType'>;
