export type SearchableSelectValue = string | number | null;

export type SearchableSelectOption = {
  value: string | number;
  label: string;
  /** Texto extra para búsqueda (p. ej. email, código). */
  searchText?: string;
  /** Agrupación secundaria (p. ej. tipo de componente). Ordena primero por group, luego por label. */
  group?: string;
};
