export type ActiveFlag = 'Y' | 'N';

export type NuevoComponenteKind = 'SYSTEM' | 'FRONTEND' | 'API' | 'DATABASE';

export type EnvironmentCode = 'DEV' | 'QA' | 'PROD';

export type EnvConfig = {
  env: EnvironmentCode;
  version: string;
  url: string;
};

export type FrontendDetails = {
  environments: EnvConfig[];
};

export type ApiDetails = {
  protocol: string;
  authenticationMethod: string;
  environments: EnvConfig[];
};

export type DatabaseDetails = {
  engine: string;
  engineVersion: string;
  instanceName: string;
  schemaName: string;
  jndiName: string;
};

export type NuevoComponenteForm = {
  kind: NuevoComponenteKind;
  parentComponentId: number | null;
  isActive: ActiveFlag;
  name: string;
  acronym: string;
  description: string;
  responsiblePersonId: number | null;
  technologyIds: number[];
  frontend: FrontendDetails;
  api: ApiDetails;
  database: DatabaseDetails;
};

export const ENVIRONMENT_CODES: EnvironmentCode[] = ['DEV', 'QA', 'PROD'];

export const PROTOCOL_OPTIONS = ['REST', 'SOAP', 'GraphQL', 'gRPC', 'Otro'] as const;

export const AUTH_METHOD_OPTIONS = [
  'Ninguna',
  'Basic',
  'JWT',
  'Bearer',
  'OAuth 2.0',
  'API Key',
  'mTLS',
] as const;

export const NUEVO_COMPONENTE_KIND_OPTIONS: { value: NuevoComponenteKind; label: string }[] = [
  { value: 'SYSTEM', label: 'Sistema' },
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'API', label: 'API' },
  { value: 'DATABASE', label: 'Base de Datos' },
];
