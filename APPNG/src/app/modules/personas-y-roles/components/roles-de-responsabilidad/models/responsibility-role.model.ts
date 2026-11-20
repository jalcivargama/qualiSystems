/** Entidad que regresa la API */
export interface ResponsibilityRole {
  roleId?: number;
  roleCode: string;
  roleName: string;
}

/** Body para CREATE (sin roleId) */
export type ResponsibilityRoleRequest = Omit<ResponsibilityRole, 'roleId'>;
