/** Entidad que regresa la API (GET /catalogos/system-responsibilities) */
export interface SystemResponsibility {
  componentId: number;
  personId: number;
  roleId: number;
  notes?: string | null;
}
