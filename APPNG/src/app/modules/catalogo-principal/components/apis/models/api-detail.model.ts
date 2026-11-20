/** Entidad que regresa la API */
export interface ApiDetail {
  componentId: number;
  componentType?: 'API';
  apiVersion?: string | null;
  url?: string | null;
  protocol?: string | null;
  authenticationMethod?: string | null;
  slaDescription?: string | null;
}
