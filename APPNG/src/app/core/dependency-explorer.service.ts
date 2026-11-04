import { Injectable } from '@angular/core';
import { CatalogStoreService, MockRecord } from './catalog-store.service';

export interface DependencyTreeNode {
  component: MockRecord;
  path: string;
  dependency?: MockRecord;
  children: DependencyTreeNode[] | null;
  expanded: boolean;
  cycle: boolean;
}

export interface DetailItem {
  label: string;
  value: string;
}

export interface PersonRole {
  name: string;
  role: string;
}

export interface ComponentCardDetails {
  description: string;
  subtype: DetailItem[];
  people: PersonRole[];
  technologies: string[];
  deployments: string[];
}

const SUBTYPE_TABLES: Record<string, string> = {
  SYSTEM: 'system_detail',
  API: 'api_detail',
  DATABASE: 'database_detail',
  INFRASTRUCTURE: 'infrastructure_detail',
};

const SUBTYPE_FIELDS: Record<string, Array<{ key: string; label: string }>> = {
  SYSTEM: [
    { key: 'business_objective', label: 'Objetivo' },
    { key: 'owner_area', label: 'Área propietaria' },
    { key: 'criticality', label: 'Criticidad' },
    { key: 'system_status', label: 'Estado del sistema' },
    { key: 'go_live_date', label: 'Puesta en producción' },
    { key: 'end_of_life_date', label: 'Fin de vida' },
  ],
  API: [
    { key: 'api_version', label: 'Versión' },
    { key: 'url', label: 'URL' },
    { key: 'protocol', label: 'Protocolo' },
    { key: 'authentication_method', label: 'Autenticación' },
    { key: 'sla_description', label: 'SLA' },
  ],
  DATABASE: [
    { key: 'engine', label: 'Motor' },
    { key: 'engine_version', label: 'Versión' },
    { key: 'instance_name', label: 'Instancia' },
    { key: 'schema_name', label: 'Esquema' },
  ],
  INFRASTRUCTURE: [
    { key: 'hostname', label: 'Hostname' },
    { key: 'ip_address', label: 'Dirección IP' },
    { key: 'operating_system', label: 'Sistema operativo' },
    { key: 'hosting_model', label: 'Alojamiento' },
  ],
};

@Injectable({ providedIn: 'root' })
export class DependencyExplorerService {
  constructor(private readonly store: CatalogStoreService) {}

  get components(): MockRecord[] {
    return [...this.store.getRecords('catalog_component')].sort((a, b) =>
      String(a['name'] ?? '').localeCompare(String(b['name'] ?? ''), 'es'),
    );
  }

  createRoot(component: MockRecord): DependencyTreeNode {
    const id = String(component['component_id']);
    return { component, path: id, children: null, expanded: false, cycle: false };
  }

  toggle(node: DependencyTreeNode): void {
    if (node.cycle) return;
    if (node.children !== null) {
      node.children = null;
      node.expanded = false;
      return;
    }

    const currentId = String(node.component['component_id']);
    const dependencies = this.store.getRecords('dependency').filter(
      (dependency) => String(dependency['origin_component_id']) === currentId,
    );
    const components = this.components;
    node.children = dependencies.map((dependency, index) => {
      const targetId = String(dependency['target_component_id']);
      const component =
        components.find((item) => String(item['component_id']) === targetId) ??
        this.missingComponent(targetId);
      const path = `${node.path}/${String(dependency['dependency_id'] ?? index)}:${targetId}`;
      return {
        component,
        dependency,
        path,
        children: null,
        expanded: false,
        cycle: node.path.split('/').some((segment) => segment.endsWith(`:${targetId}`)) ||
          currentId === targetId ||
          this.pathHasComponent(node.path, targetId),
      };
    });
    node.expanded = true;
  }

  details(component: MockRecord): ComponentCardDetails {
    const id = String(component['component_id']);
    const type = String(component['component_type'] ?? '');
    const detailTable = SUBTYPE_TABLES[type];
    const subtypeRow = detailTable
      ? this.store.getRecords(detailTable).find((row) => String(row['component_id']) === id)
      : undefined;

    const subtype = (SUBTYPE_FIELDS[type] ?? [])
      .map(({ key, label }) => ({ label, value: this.display(subtypeRow?.[key]) }))
      .filter((item) => item.value);

    const people = this.store.getRecords('system_responsibility')
      .filter((record) => String(record['component_id']) === id)
      .map((record) => {
        const person = this.store.getRecords('person').find(
          (row) => String(row['person_id']) === String(record['person_id']),
        );
        const role = this.store.getRecords('responsibility_role').find(
          (row) => String(row['role_id']) === String(record['role_id']),
        );
        return {
          name: String(person?.['full_name'] ?? `Persona #${String(record['person_id'] ?? '?')}`),
          role: String(role?.['role_name'] ?? 'Rol no especificado'),
        };
      });

    const technologies = this.store.getRecords('component_technology')
      .filter((record) => String(record['component_id']) === id)
      .map((record) => {
        const technology = this.store.getRecords('technology').find(
          (row) => String(row['technology_id']) === String(record['technology_id']),
        );
        if (!technology) return '';
        const version = this.display(record['version']);
        return `${String(technology['name'] ?? 'Tecnología')}${version ? ` · ${version}` : ''}`;
      })
      .filter(Boolean);

    const deployments = this.store.getRecords('system_deployment')
      .filter((record) => String(record['component_id']) === id)
      .map((record) => {
        const environment = this.display(record['environment']);
        const url = this.display(record['url']);
        return [environment, url].filter(Boolean).join(' · ');
      })
      .filter(Boolean);

    return {
      description: this.display(component['description']),
      subtype,
      people,
      technologies,
      deployments,
    };
  }

  componentStatus(component: MockRecord): string {
    return component['is_active'] === 'N' ? 'Inactivo' : 'Activo';
  }

  componentType(component: MockRecord): string {
    const labels: Record<string, string> = {
      SYSTEM: 'Sistema',
      API: 'API',
      DATABASE: 'Base de datos',
      INFRASTRUCTURE: 'Infraestructura',
      EXTERNAL_SERVICE: 'Servicio externo',
      MESSAGING: 'Mensajería',
      UNKNOWN: 'No catalogado',
    };
    const type = String(component['component_type'] ?? 'COMPONENT');
    return labels[type] ?? this.readable(type);
  }

  dependencyType(dependency: MockRecord | undefined): string {
    if (!dependency) return '';
    const type = this.store.getRecords('dependency_type').find(
      (record) => String(record['dependency_type_id']) === String(dependency['dependency_type_id']),
    );
    return String(type?.['type_name'] ?? this.readable(String(type?.['type_code'] ?? 'Dependencia')));
  }

  private pathHasComponent(path: string, componentId: string): boolean {
    return path.split('/').some((segment) => segment.split(':').at(-1) === componentId);
  }

  private missingComponent(id: string): MockRecord {
    return {
      _mockId: `missing-${id}`,
      component_id: id,
      component_type: 'UNKNOWN',
      name: `Componente no encontrado (#${id})`,
      acronym: '',
      description: 'La dependencia apunta a un identificador que no existe en el catálogo.',
      is_active: 'N',
    };
  }

  private display(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      PLANNED: 'Planeado',
      DEPRECATED: 'Obsoleto',
      RETIRED: 'Retirado',
      CRITICAL: 'Crítica',
      HIGH: 'Alta',
      MEDIUM: 'Media',
      LOW: 'Baja',
      CLOUD: 'Nube',
      ON_PREMISE: 'Local',
      DEVELOPMENT: 'Desarrollo',
      TEST: 'Pruebas',
      QA: 'Calidad',
      STAGING: 'Preproducción',
      PRODUCTION: 'Producción',
      DR: 'Recuperación ante desastres',
    };
    return labels[String(value)] ?? String(value).replaceAll('_', ' ');
  }

  private readable(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
