/** Entidad que regresa la API */
export interface SystemResponsibility {
  componentId: number;
  personId: number;
  roleId: number;
  notes?: string | null;
}
