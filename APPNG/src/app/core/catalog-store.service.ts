import { Injectable } from '@angular/core';

export type FieldType = 'text' | 'textarea' | 'select' | 'email' | 'url' | 'date';

export interface CatalogField {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  hidden?: boolean;
}

export interface CatalogDefinition {
  table: string;
  title: string;
  description: string;
  group: string;
  keyFields: string[];
  autoId?: string;
  fields: CatalogField[];
}

export type MockRecord = Record<string, string | number | boolean | null> & {
  _mockId: string;
};

const f = (
  key: string,
  label: string,
  type: FieldType = 'text',
  required = false,
  options?: string[],
  hidden = false,
): CatalogField => ({ key, label, type, required, options, hidden });

const definitions: CatalogDefinition[] = [
  {
    table: 'catalog_component',
    title: 'Componentes',
    description: 'Sistemas, APIs, bases de datos, infraestructura y servicios conectados.',
    group: 'Catálogo principal',
    keyFields: ['component_id'],
    autoId: 'component_id',
    fields: [
      f('component_id', 'ID componente', 'text', true, undefined, true),
      f('component_type', 'Tipo', 'select', true, ['SYSTEM', 'API', 'DATABASE', 'INFRASTRUCTURE', 'EXTERNAL_SERVICE', 'MESSAGING']),
      f('name', 'Nombre', 'text', true),
      f('acronym', 'Acrónimo'),
      f('description', 'Descripción', 'textarea'),
      f('is_active', 'Activo', 'select', true, ['Y', 'N']),
      f('created_at', 'Creado el', 'text', false, undefined, true),
      f('updated_at', 'Actualizado el', 'text', false, undefined, true),
    ],
  },
  {
    table: 'system_detail',
    title: 'Sistemas',
    description: 'Objetivo, propiedad, criticidad y ciclo de vida de cada sistema.',
    group: 'Catálogo principal',
    keyFields: ['component_id'],
    fields: [
      f('component_id', 'ID componente', 'text', true),
      f('business_objective', 'Objetivo de negocio', 'textarea'),
      f('owner_area', 'Área propietaria'),
      f('criticality', 'Criticidad', 'select', false, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      f('system_status', 'Estado', 'select', true, ['PLANNED', 'ACTIVE', 'DEPRECATED', 'RETIRED']),
      f('go_live_date', 'Puesta en producción', 'date'),
      f('end_of_life_date', 'Fin de vida', 'date'),
    ],
  },
  {
    table: 'api_detail',
    title: 'APIs',
    description: 'Versiones, endpoints, protocolo, autenticación y SLA.',
    group: 'Catálogo principal',
    keyFields: ['component_id'],
    fields: [
      f('component_id', 'ID componente', 'text', true),
      f('api_version', 'Versión'),
      f('url', 'URL', 'url'),
      f('protocol', 'Protocolo', 'select', false, ['REST', 'SOAP', 'GraphQL', 'gRPC', 'Otro']),
      f('authentication_method', 'Autenticación'),
      f('sla_description', 'Descripción de SLA', 'textarea'),
    ],
  },
  {
    table: 'database_detail',
    title: 'Bases de datos',
    description: 'Motores, instancias y esquemas asociados al catálogo.',
    group: 'Catálogo principal',
    keyFields: ['component_id'],
    fields: [
      f('component_id', 'ID componente', 'text', true),
      f('engine', 'Motor', 'text', true),
      f('engine_version', 'Versión'),
      f('instance_name', 'Instancia'),
      f('schema_name', 'Esquema'),
    ],
  },
  {
    table: 'infrastructure_detail',
    title: 'Infraestructura',
    description: 'Hosts, direcciones de red, sistema operativo y alojamiento.',
    group: 'Catálogo principal',
    keyFields: ['component_id'],
    fields: [
      f('component_id', 'ID componente', 'text', true),
      f('hostname', 'Hostname'),
      f('ip_address', 'Dirección IP'),
      f('operating_system', 'Sistema operativo'),
      f('hosting_model', 'Modelo de alojamiento', 'select', false, ['CLOUD', 'ON_PREMISE']),
    ],
  },
  {
    table: 'system_deployment',
    title: 'Despliegues',
    description: 'URLs de los sistemas según su ambiente.',
    group: 'Operación',
    keyFields: ['deployment_id'],
    autoId: 'deployment_id',
    fields: [
      f('deployment_id', 'ID despliegue', 'text', true, undefined, true),
      f('component_id', 'ID sistema', 'text', true),
      f('environment', 'Ambiente', 'select', true, ['DEVELOPMENT', 'TEST', 'QA', 'STAGING', 'PRODUCTION', 'DR']),
      f('url', 'URL', 'url'),
    ],
  },
  {
    table: 'person',
    title: 'Personas',
    description: 'Contactos internos y proveedores responsables de los sistemas.',
    group: 'Personas y roles',
    keyFields: ['person_id'],
    autoId: 'person_id',
    fields: [
      f('person_id', 'ID persona', 'text', true, undefined, true),
      f('full_name', 'Nombre completo', 'text', true),
      f('email', 'Correo electrónico', 'email'),
      f('organization', 'Organización'),
      f('is_active', 'Activo', 'select', true, ['Y', 'N']),
    ],
  },
  {
    table: 'responsibility_role',
    title: 'Roles de responsabilidad',
    description: 'Roles disponibles para asignar responsables a los sistemas.',
    group: 'Personas y roles',
    keyFields: ['role_id'],
    autoId: 'role_id',
    fields: [
      f('role_id', 'ID rol', 'text', true, undefined, true),
      f('role_code', 'Código', 'text', true),
      f('role_name', 'Nombre del rol', 'text', true),
    ],
  },
  {
    table: 'system_responsibility',
    title: 'Responsables de sistemas',
    description: 'Asignaciones de personas y roles a los sistemas.',
    group: 'Personas y roles',
    keyFields: ['component_id', 'person_id', 'role_id'],
    fields: [
      f('component_id', 'ID sistema', 'text', true),
      f('person_id', 'ID persona', 'text', true),
      f('role_id', 'ID rol', 'text', true),
      f('notes', 'Notas', 'textarea'),
    ],
  },
  {
    table: 'technology',
    title: 'Tecnologías',
    description: 'Catálogo de lenguajes, frameworks, mensajería y herramientas.',
    group: 'Tecnología',
    keyFields: ['technology_id'],
    autoId: 'technology_id',
    fields: [
      f('technology_id', 'ID tecnología', 'text', true, undefined, true),
      f('category', 'Categoría', 'select', true, ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'FRONTEND', 'BACKEND', 'MESSAGING', 'CONTAINER', 'ORCHESTRATION', 'MONITORING', 'OTHER']),
      f('name', 'Nombre', 'text', true),
    ],
  },
  {
    table: 'component_technology',
    title: 'Stack tecnológico',
    description: 'Tecnologías y versiones utilizadas por cada componente.',
    group: 'Tecnología',
    keyFields: ['component_id', 'technology_id'],
    fields: [
      f('component_id', 'ID componente', 'text', true),
      f('technology_id', 'ID tecnología', 'text', true),
      f('version', 'Versión'),
      f('is_primary', 'Principal', 'select', true, ['Y', 'N']),
    ],
  },
  {
    table: 'dependency_type',
    title: 'Tipos de dependencia',
    description: 'Mecanismos de comunicación entre los componentes.',
    group: 'Dependencias',
    keyFields: ['dependency_type_id'],
    autoId: 'dependency_type_id',
    fields: [
      f('dependency_type_id', 'ID tipo', 'text', true, undefined, true),
      f('type_code', 'Código', 'text', true),
      f('type_name', 'Nombre', 'text', true),
    ],
  },
  {
    table: 'dependency',
    title: 'Dependencias',
    description: 'Relaciones dirigidas entre el componente origen y destino.',
    group: 'Dependencias',
    keyFields: ['dependency_id'],
    autoId: 'dependency_id',
    fields: [
      f('dependency_id', 'ID dependencia', 'text', true, undefined, true),
      f('origin_component_id', 'Componente origen', 'text', true),
      f('target_component_id', 'Componente destino', 'text', true),
      f('dependency_type_id', 'ID tipo de dependencia', 'text', true),
      f('dependency_scope', 'Alcance', 'select', true, ['INTERNAL', 'EXTERNAL']),
      f('criticality', 'Criticidad', 'select', false, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      f('description', 'Descripción', 'textarea'),
      f('created_at', 'Creado el', 'text', false, undefined, true),
    ],
  },
  {
    table: 'data_flow',
    title: 'Flujos de datos',
    description: 'Datos intercambiados, periodicidad, sensibilidad y formato.',
    group: 'Dependencias',
    keyFields: ['data_flow_id'],
    autoId: 'data_flow_id',
    fields: [
      f('data_flow_id', 'ID flujo', 'text', true, undefined, true),
      f('dependency_id', 'ID dependencia', 'text', true),
      f('data_name', 'Dato intercambiado', 'text', true),
      f('periodicity', 'Periodicidad'),
      f('sensitivity', 'Sensibilidad', 'select', false, ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']),
      f('data_format', 'Formato'),
      f('description', 'Descripción', 'textarea'),
    ],
  },
];

const initialData: Record<string, Omit<MockRecord, '_mockId'>[]> = {
  catalog_component: [
    { component_id: 1, component_type: 'SYSTEM', name: 'Portal de clientes', acronym: 'PORTAL', description: 'Canal digital de clientes', is_active: 'Y' },
    { component_id: 2, component_type: 'API', name: 'API Clientes', acronym: 'API-C', description: 'Servicios de clientes', is_active: 'Y' },
    { component_id: 3, component_type: 'DATABASE', name: 'Oracle Clientes', acronym: 'DB-CLI', description: 'Base transaccional de clientes', is_active: 'Y' },
    { component_id: 4, component_type: 'SYSTEM', name: 'Gestión de pagos', acronym: 'PAGOS', description: 'Procesamiento de pagos y conciliación', is_active: 'Y' },
  ],
  system_detail: [
    { component_id: 1, business_objective: 'Atender operaciones de clientes por canal digital.', owner_area: 'Experiencia de Cliente', criticality: 'HIGH', system_status: 'ACTIVE', go_live_date: '2022-05-10' },
    { component_id: 4, business_objective: 'Procesar pagos y conciliaciones.', owner_area: 'Finanzas', criticality: 'CRITICAL', system_status: 'ACTIVE', go_live_date: '2021-11-01' },
  ],
  api_detail: [
    { component_id: 2, api_version: 'v2.4', url: 'https://api.demo.local/clientes', protocol: 'REST', authentication_method: 'OAuth 2.0', sla_description: '99.9% mensual' },
  ],
  database_detail: [
    { component_id: 3, engine: 'Oracle Database', engine_version: '19c', instance_name: 'ORCLCLI01', schema_name: 'CLIENTES' },
  ],
  infrastructure_detail: [],
  system_deployment: [
    { deployment_id: 1, component_id: 1, environment: 'PRODUCTION', url: 'https://portal.demo.local' },
    { deployment_id: 2, component_id: 4, environment: 'PRODUCTION', url: 'https://pagos.demo.local' },
  ],
  person: [
    { person_id: 1, full_name: 'María López', email: 'maria.lopez@demo.local', organization: 'TI Corporativo', is_active: 'Y' },
    { person_id: 2, full_name: 'Carlos Méndez', email: 'carlos.mendez@demo.local', organization: 'Finanzas', is_active: 'Y' },
  ],
  responsibility_role: [
    { role_id: 1, role_code: 'TECHNICAL_OWNER', role_name: 'Responsable técnico' },
    { role_id: 2, role_code: 'BUSINESS_OWNER', role_name: 'Dueño de negocio' },
    { role_id: 3, role_code: 'DEVELOPMENT_LEAD', role_name: 'Líder de desarrollo' },
  ],
  system_responsibility: [
    { component_id: 1, person_id: 1, role_id: 1, notes: 'Responsable de operación' },
    { component_id: 4, person_id: 2, role_id: 2, notes: 'Dueño funcional' },
  ],
  technology: [
    { technology_id: 1, category: 'FRONTEND', name: 'Angular' },
    { technology_id: 2, category: 'DATABASE', name: 'Oracle Database' },
    { technology_id: 3, category: 'BACKEND', name: 'Java' },
  ],
  component_technology: [
    { component_id: 1, technology_id: 1, version: '21', is_primary: 'Y' },
    { component_id: 3, technology_id: 2, version: '19c', is_primary: 'Y' },
  ],
  dependency_type: [
    { dependency_type_id: 1, type_code: 'REST_API', type_name: 'API REST' },
    { dependency_type_id: 2, type_code: 'DATABASE', type_name: 'Base de datos' },
    { dependency_type_id: 3, type_code: 'KAFKA', type_name: 'Kafka' },
  ],
  dependency: [
    { dependency_id: 1, origin_component_id: 1, target_component_id: 2, dependency_type_id: 1, dependency_scope: 'INTERNAL', criticality: 'HIGH', description: 'Consulta información de clientes' },
    { dependency_id: 2, origin_component_id: 2, target_component_id: 3, dependency_type_id: 2, dependency_scope: 'INTERNAL', criticality: 'HIGH', description: 'Acceso a datos de clientes' },
    { dependency_id: 3, origin_component_id: 4, target_component_id: 2, dependency_type_id: 1, dependency_scope: 'INTERNAL', criticality: 'MEDIUM', description: 'Validación de identidad del pagador' },
  ],
  data_flow: [
    { data_flow_id: 1, dependency_id: 1, data_name: 'Perfil de cliente', periodicity: 'Bajo demanda', sensitivity: 'CONFIDENTIAL', data_format: 'JSON' },
    { data_flow_id: 2, dependency_id: 3, data_name: 'Identidad del pagador', periodicity: 'Bajo demanda', sensitivity: 'RESTRICTED', data_format: 'JSON' },
  ],
};

const STORE_PREFIX = 'appng.mock.';
let nextMockId = 0;

@Injectable({ providedIn: 'root' })
export class CatalogStoreService {
  readonly definitions = definitions;

  getDefinition(table: string | null): CatalogDefinition | undefined {
    return definitions.find((definition) => definition.table === table);
  }

  getRecords(table: string): MockRecord[] {
    const stored = this.read(table);
    if (stored) return stored;

    const seeded = (initialData[table] ?? []).map((record) => ({
      ...record,
      _mockId: this.keyOf(table, record),
    })) as MockRecord[];
    this.write(table, seeded);
    return seeded;
  }

  save(table: string, record: Record<string, string>, editId?: string): void {
    const rows = this.getRecords(table);
    const definition = this.getDefinition(table);
    if (!definition) throw new Error(`No existe el catálogo ${table}`);

    if (editId) {
      const index = rows.findIndex((row) => row._mockId === editId);
      if (index < 0) throw new Error('No se encontró el registro que deseas editar.');
      rows[index] = { ...rows[index], ...record, _mockId: editId };
    } else {
      const newRecord: Record<string, string | number | boolean | null> = { ...record };
      if (definition.autoId) {
        const maxId = rows.reduce((max, row) => Math.max(max, Number(row[definition.autoId!]) || 0), 0);
        newRecord[definition.autoId] = maxId + 1;
      }
      const mockId = `${table}-${++nextMockId}-${Date.now()}`;
      rows.push({ ...newRecord, _mockId: mockId });
    }
    this.write(table, rows);
  }

  remove(table: string, mockId: string): void {
    this.write(table, this.getRecords(table).filter((row) => row._mockId !== mockId));
  }

  count(table: string): number {
    return this.getRecords(table).length;
  }

  private keyOf(table: string, row: Omit<MockRecord, '_mockId'>): string {
    const definition = this.getDefinition(table);
    return definition?.keyFields.map((key) => String(row[key] ?? '')).join(':') ?? `${table}:${++nextMockId}`;
  }

  private read(table: string): MockRecord[] | null {
    try {
      const value = localStorage.getItem(`${STORE_PREFIX}${table}`);
      return value ? (JSON.parse(value) as MockRecord[]) : null;
    } catch (error) {
      console.error(`No fue posible leer el mock local para ${table}.`, error);
      return null;
    }
  }

  private write(table: string, records: MockRecord[]): void {
    try {
      localStorage.setItem(`${STORE_PREFIX}${table}`, JSON.stringify(records));
    } catch (error) {
      console.error(`No fue posible guardar el mock local para ${table}.`, error);
      throw new Error('No se pudo guardar el cambio en el almacenamiento local del navegador.');
    }
  }
}
