export enum TiposAutentificacion {
  BEARER_TOKEN = 'Bearer Token',
  BASIC_AUTH = 'Basic Auth',
  API_KEY = 'Api Key',
  OAUTH2 = 'OAuth2',
  JWT = 'JWT',
  OAuth = 'OAuth',
}

export const TIPOS_AUTENTIFICACION_OPTIONS: {
  value: TiposAutentificacion;
  label: string;
}[] = [
  { value: TiposAutentificacion.BEARER_TOKEN, label: 'Bearer Token' },
  { value: TiposAutentificacion.BASIC_AUTH, label: 'Basic Auth' },
  { value: TiposAutentificacion.API_KEY, label: 'Api Key' },
  { value: TiposAutentificacion.OAUTH2, label: 'OAuth2' },
  { value: TiposAutentificacion.JWT, label: 'JWT' },
  { value: TiposAutentificacion.OAuth, label: 'OAuth' },
];
