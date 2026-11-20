import { ActiveFlag, ComponentType } from './create.component.dto';

export type CreateComponentResponseDto = {
  componentId: number;
  componentType: ComponentType | string;
  name: string;
  acronym?: string | null;
  description?: string | null;
  isActive: ActiveFlag | string;
  createdAt: string;
  updatedAt: string;
};
