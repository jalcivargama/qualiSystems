export type ComponentType =
  | 'SYSTEM'
  | 'API'
  | 'DATABASE'
  | 'INFRASTRUCTURE'
  | 'EXTERNAL_SERVICE'
  | 'MESSAGING';

export type ActiveFlag = 'Y' | 'N';

export interface CreateNewComponentDto {
  componentType: ComponentType;
  name: string;
  acronym?: string | null;
  description?: string | null;
  isActive: ActiveFlag;
}
