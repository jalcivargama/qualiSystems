export type ComponentType =
  | 'SYSTEM'
  | 'API'
  | 'DATABASE'
  | 'INFRASTRUCTURE'
  | 'EXTERNAL_SERVICE'
  | 'MESSAGING';

export type ActiveFlag = 'Y' | 'N';

/** Entidad que regresa la API (GET / POST / PUT) */
export interface CatalogComponent {
  componentId?: number;
  componentType: ComponentType;
  name: string;
  acronym?: string | null;
  description?: string | null;
  resourceType?: string | null;
  isActive: ActiveFlag;
  createdAt?: string;
  updatedAt?: string;
}

/** Body para CREATE y UPDATE (sin campos de solo lectura) */
export type ComponentRequest = Omit<CatalogComponent, 'componentId' | 'createdAt' | 'updatedAt'>;
