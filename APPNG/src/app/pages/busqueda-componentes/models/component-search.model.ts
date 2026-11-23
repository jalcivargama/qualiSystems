import {
  ActiveFlag,
  ComponentType,
} from '../../../modules/catalogo-principal/components/componentes/models/component.model';

export interface ComponentSearchCriteria {
  componentTypes: ComponentType[];
  name: string | null;
  acronym: string | null;
  technologyIds: number[];
  personIds: number[];
}

export interface ComponentSearchTechnology {
  technologyId: number;
  name: string;
  version: string | null;
}

export interface ComponentSearchResponsibility {
  personId: number;
  fullName: string;
  roleName: string;
}

export interface ComponentSearchResult {
  componentId: number;
  componentType: ComponentType;
  componentTypeLabel: string;
  name: string;
  acronym: string | null;
  description: string | null;
  isActive: ActiveFlag;
  technologies: ComponentSearchTechnology[];
  responsibilities: ComponentSearchResponsibility[];
}
