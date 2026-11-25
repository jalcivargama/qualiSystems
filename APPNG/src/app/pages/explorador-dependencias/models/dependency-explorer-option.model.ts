import { ActiveFlag, ComponentType } from '../../../modules/catalogo-principal/components/componentes/models/component.model';

export interface DependencyExplorerOption {
  componentId: number;
  componentType: ComponentType;
  componentTypeLabel: string;
  name: string;
  acronym: string | null;
  isActive: ActiveFlag;
}

export interface DependencyExplorerSystemSubtype {
  type: 'SYSTEM';
  businessObjective: string | null;
  ownerArea: string | null;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  systemStatus: 'PLANNED' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';
  goLiveDate: string | null;
  endOfLifeDate: string | null;
}

export interface DependencyExplorerApiSubtype {
  type: 'API';
  apiVersion: string | null;
  url: string | null;
  protocol: string | null;
  authenticationMethod: string | null;
  slaDescription: string | null;
}

export interface DependencyExplorerDatabaseSubtype {
  type: 'DATABASE';
  engine: string;
  engineVersion: string | null;
  instanceName: string | null;
  schemaName: string | null;
}

export interface DependencyExplorerInfrastructureSubtype {
  type: 'INFRASTRUCTURE';
  hostname: string | null;
  ipAddress: string | null;
  operatingSystem: string | null;
  hostingModel: 'CLOUD' | 'ON_PREMISE' | null;
}

export type DependencyExplorerSubtype =
  | DependencyExplorerSystemSubtype
  | DependencyExplorerApiSubtype
  | DependencyExplorerDatabaseSubtype
  | DependencyExplorerInfrastructureSubtype;

export interface DependencyExplorerResponsibility {
  personId: number;
  fullName: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  notes: string | null;
}

export interface DependencyExplorerTechnology {
  technologyId: number;
  category: string;
  name: string;
  version: string | null;
  isPrimary: ActiveFlag;
}

export interface DependencyExplorerDeployment {
  deploymentId: number;
  environment:
    | 'DEVELOPMENT'
    | 'TEST'
    | 'QA'
    | 'STAGING'
    | 'PRODUCTION'
    | 'DR';
  url: string | null;
}

export interface DependencyExplorerComponent extends DependencyExplorerOption {
  resourceType?: 'I' | 'E' | null;
  description: string | null;
  subtype: DependencyExplorerSubtype | null;
  responsibilities: DependencyExplorerResponsibility[];
  technologies: DependencyExplorerTechnology[];
  deployments: DependencyExplorerDeployment[];
}

export interface DependencyExplorerType {
  dependencyTypeId: number;
  typeCode: string;
  typeName: string;
}

export interface DependencyExplorerOutgoingDependency {
  dependencyId: number;
  flowTipe?: 'I' | 'O' | 'B' | null;
  dependencyType: DependencyExplorerType;
  dependencyScope: 'INTERNAL' | 'EXTERNAL';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  description: string | null;
  createdAt: string | null;
  targetComponent: DependencyExplorerComponent;
}

export interface DependencyExplorerResponse {
  component: DependencyExplorerComponent;
  outgoingDependencies: DependencyExplorerOutgoingDependency[];
}
