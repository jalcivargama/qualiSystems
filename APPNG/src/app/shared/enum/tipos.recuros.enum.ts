/** Códigos de resourceType en catálogo / explorador */
export enum TiposRecursos {
  INTERNO = 'I',
  EXTERNO = 'E',
  /* COMPARTIDO = 'C',
  OTRO = 'O', */
}

export const TIPOS_RECURSOS_OPTIONS: { value: TiposRecursos; label: string }[] = [
  { value: TiposRecursos.INTERNO, label: 'Interno' },
  { value: TiposRecursos.EXTERNO, label: 'Externo' },
];
