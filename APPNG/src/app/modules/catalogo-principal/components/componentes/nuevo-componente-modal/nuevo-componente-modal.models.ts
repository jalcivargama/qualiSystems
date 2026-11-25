import { Criticality, SystemStatus } from '../../sistemas/models/system-detail.model';
import { Environment } from '../../../../operacion/components/despliegues/models/system-deployment.model';

export type ActiveFlag = 'Y' | 'N';

/** Tipos soportados en el alta (máx. 1 de cada uno). */
export type NuevoComponenteKind = 'SYSTEM' | 'API' | 'DATABASE';

export type EnvironmentCode = 'DEV' | 'QA' | 'PROD';

export type DeploymentEnvironment = Extract<Environment, 'DEVELOPMENT' | 'QA' | 'PRODUCTION'>;

export type EnvConfig = {
  env: EnvironmentCode;
  version: string;
  url: string;
};

export type DeploymentConfig = {
  environment: DeploymentEnvironment;
  url: string;
};

export type FrontendDetails = {
  environments: EnvConfig[];
};

export type ApiDetails = {
  apiVersion: string;
  url: string;
  urlDoc: string;
  protocol: string;
  authenticationMethod: string;
  slaDescription: string;
};

export type DatabaseDetails = {
  engine: string;
  engineVersion: string;
  instanceName: string;
  schemaName: string;
};

export type SystemDetails = {
  ownerArea: string;
  criticality: Criticality | '';
  systemStatus: SystemStatus;
  goLiveDate: string;
  endOfLifeDate: string;
};

export type NuevoComponenteForm = {
  kind: NuevoComponenteKind;
  parentComponentId: number | null;
  isActive: ActiveFlag;
  name: string;
  acronym: string;
  resourceType: string;
  description: string;
  responsiblePersonId: number | null;
  responsibleRoleId: number | null;
  technologyIds: number[];
  system: SystemDetails;
  deployments: DeploymentConfig[];
  frontend: FrontendDetails;
  api: ApiDetails;
  database: DatabaseDetails;
};

/** Borrador editable dentro del modal (incluye id local). */
export type NuevoComponenteDraft = NuevoComponenteForm & {
  id: string;
};

export const ENVIRONMENT_CODES: EnvironmentCode[] = ['DEV', 'QA', 'PROD'];

export const DEPLOYMENT_ENVIRONMENTS: {
  value: DeploymentEnvironment;
  label: string;
}[] = [
  { value: 'DEVELOPMENT', label: 'DESARROLLO' },
  { value: 'QA', label: 'QA' },
  { value: 'PRODUCTION', label: 'PRODUCCIÓN' },
];

export const PROTOCOL_OPTIONS = [
  'REST',
  'SOAP',
  'GraphQL',
  'gRPC',
  'HTTPS',
  'HTTP',
  'Otro',
] as const;

export const CRITICALITY_OPTIONS: { value: Criticality; label: string }[] = [
  { value: 'LOW', label: 'BAJA' },
  { value: 'MEDIUM', label: 'MEDIA' },
  { value: 'HIGH', label: 'ALTA' },
  { value: 'CRITICAL', label: 'CRÍTICA' },
];

export const SYSTEM_STATUS_OPTIONS: { value: SystemStatus; label: string }[] = [
  { value: 'PLANNED', label: 'PLANIFICADO' },
  { value: 'ACTIVE', label: 'ACTIVO' },
  { value: 'DEPRECATED', label: 'DEPRECADO' },
  { value: 'RETIRED', label: 'RETIRADO' },
];

export const NUEVO_COMPONENTE_KIND_OPTIONS: { value: NuevoComponenteKind; label: string }[] = [
  { value: 'SYSTEM', label: 'Sistema' },
  { value: 'API', label: 'API' },
  { value: 'DATABASE', label: 'Base de Datos' },
];

export const MAX_NUEVO_COMPONENTES = NUEVO_COMPONENTE_KIND_OPTIONS.length;
