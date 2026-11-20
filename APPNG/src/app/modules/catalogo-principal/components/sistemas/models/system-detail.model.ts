export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SystemStatus = 'PLANNED' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';

/** Entidad que regresa la API (GET /catalogos/system-details) */
export interface SystemDetail {
  componentId: number;
  componentType?: 'SYSTEM';
  businessObjective?: string | null;
  ownerArea?: string | null;
  criticality?: Criticality | null;
  systemStatus: SystemStatus;
  goLiveDate?: string | null;
  endOfLifeDate?: string | null;
}
