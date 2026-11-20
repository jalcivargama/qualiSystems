import { ActiveFlag, ComponentType } from './create.component.dto';

export interface CatalogComponent {
  componentId?: number;
  componentType: ComponentType;
  name: string;
  acronym?: string | null;
  description?: string | null;
  isActive: ActiveFlag;
  createdAt?: string;
  updatedAt?: string;
}
