export type ActiveFlag = 'Y' | 'N';

export type SystemComponentKind = 'FRONTEND' | 'API' | 'DATABASE';

export type EnvironmentCode = 'DEV' | 'QA' | 'PROD';

export type EnvConfig = {
  env: EnvironmentCode;
  version: string;
  url: string;
};

export type FrontendComponentForm = {
  id: string;
  kind: 'FRONTEND';
  environments: EnvConfig[];
  technologyIds: number[];
};

export type ApiComponentForm = {
  id: string;
  kind: 'API';
  protocol: string;
  authenticationMethod: string;
  environments: EnvConfig[];
  technologyIds: number[];
};

export type DatabaseComponentForm = {
  id: string;
  kind: 'DATABASE';
  engine: string;
  engineVersion: string;
  instanceName: string;
  schemaName: string;
  jndiName: string;
  technologyIds: number[];
};

export type SystemChildComponent =
  | FrontendComponentForm
  | ApiComponentForm
  | DatabaseComponentForm;

export type NuevoSistemaForm = {
  isActive: ActiveFlag;
  name: string;
  acronym: string;
  description: string;
  responsiblePersonId: number | null;
  components: SystemChildComponent[];
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

export const COMPONENT_KIND_OPTIONS: { value: SystemComponentKind; label: string }[] = [
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'API', label: 'API' },
  { value: 'DATABASE', label: 'Base de Datos' },
];
