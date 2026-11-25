/** Entidad que regresa la API /catalogos/areas */
export interface CatalogArea {
  areaName: string;
  description?: string | null;
  acronym?: string | null;
  contactPersonId?: number | null;
}
