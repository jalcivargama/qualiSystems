import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast.service';
import {
  ComponentCardDetails,
  DependencyExplorerService,
  DependencyTreeNode,
} from '../../core/dependency-explorer.service';
import { MockRecord } from '../../core/catalog-store.service';
import { DependencyExplorerApiService } from './dependency-explorer-api.service';
import {
  DependencyExplorerComponent,
  DependencyExplorerResponse,
  DependencyExplorerSubtype,
} from './models/dependency-explorer-option.model';

@Component({
  selector: 'app-explorador-dependencias',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './explorador-dependencias.component.html',
  styleUrl: './explorador-dependencias.component.css',
})
export class ExploradorDependenciasComponent implements OnInit {
  private readonly api = inject(DependencyExplorerApiService);
  private readonly toastService = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  components: MockRecord[] = [];
  selectedId = '';
  root: DependencyTreeNode | null = null;
  loadingComponents = false;
  private readonly detailCache = new Map<string, ComponentCardDetails>();
  private readonly responseCache = new Map<string, DependencyExplorerResponse>();
  private readonly expandedDetails = new Set<string>();

  constructor(readonly explorer: DependencyExplorerService) {}

  ngOnInit(): void {
    this.loadComponents();
  }

  String(value: unknown): string {
    return String(value ?? '');
  }

  selectComponent(id: string): void {
    this.detailCache.clear();
    this.responseCache.clear();
    this.expandedDetails.clear();
    this.root = null;
    if (!id) return;

    const componentId = Number(id);
    if (!Number.isInteger(componentId) || componentId <= 0) return;

    this.loadingComponents = true;
    this.api.getComponent(componentId).subscribe({
      next: (response) => {
        this.loadingComponents = false;
        if (this.selectedId !== id) {
          this.changeDetector.markForCheck();
          return;
        }
        this.cacheResponse(response);
        this.root = this.explorer.createRoot(this.toComponentRecord(response.component));
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loadingComponents = false;
        if (this.selectedId !== id) {
          this.changeDetector.markForCheck();
          return;
        }
        this.toastService.error(
          'No se pudo cargar el componente',
          this.resolveErrorMessage(error),
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  toggle(node: DependencyTreeNode): void {
    if (node.cycle || node.loading) return;
    if (node.children !== null) {
      node.children = null;
      node.expanded = false;
      return;
    }

    const componentId = String(node.component['component_id']);
    const cachedResponse = this.responseCache.get(componentId);
    if (cachedResponse) {
      this.expandNode(node, cachedResponse);
      return;
    }

    node.loading = true;
    this.api.getComponent(Number(componentId)).subscribe({
      next: (response) => {
        node.loading = false;
        this.cacheResponse(response);
        node.component = this.toComponentRecord(response.component);
        this.expandNode(node, response);
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        node.loading = false;
        this.toastService.error(
          'No se pudieron cargar las dependencias',
          this.resolveErrorMessage(error),
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  toggleDetails(node: DependencyTreeNode): void {
    if (this.expandedDetails.has(node.path)) {
      this.expandedDetails.delete(node.path);
    } else {
      this.expandedDetails.add(node.path);
    }
    this.changeDetector.markForCheck();
  }

  detailsOpen(node: DependencyTreeNode): boolean {
    return this.expandedDetails.has(node.path);
  }

  detailsFor(component: MockRecord): ComponentCardDetails {
    const id = String(component['component_id']);
    const cached = this.detailCache.get(id);
    if (cached) return cached;
    const details = this.explorer.details(component);
    this.detailCache.set(id, details);
    return details;
  }

  initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
  }

  readable(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private loadComponents(): void {
    this.loadingComponents = true;
    this.api.getComponents().subscribe({
      next: (components) => {
        this.components = components.map((component) => ({
          _mockId: `api-${component.componentId}`,
          component_id: component.componentId,
          component_type: component.componentType,
          component_type_label: component.componentTypeLabel,
          name: component.name,
          acronym: component.acronym ?? '',
          description: '',
          is_active: component.isActive,
        }));
        this.loadingComponents = false;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.components = [];
        this.loadingComponents = false;
        this.toastService.error(
          'No se pudieron cargar los componentes',
          this.resolveErrorMessage(error),
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (error.status === 0) {
      return 'No fue posible conectar con la API en localhost.';
    }
    if (typeof error.error?.['message'] === 'string') {
      return error.error['message'];
    }
    return `La API respondió con el estado ${error.status}.`;
  }

  private cacheResponse(response: DependencyExplorerResponse): void {
    const componentId = String(response.component.componentId);
    this.responseCache.set(componentId, response);
    this.detailCache.set(componentId, this.toCardDetails(response.component));
    for (const dependency of response.outgoingDependencies) {
      const target = dependency.targetComponent;
      this.detailCache.set(String(target.componentId), this.toCardDetails(target));
    }
  }

  private expandNode(node: DependencyTreeNode, response: DependencyExplorerResponse): void {
    const currentId = String(node.component['component_id']);
    node.children = response.outgoingDependencies.map((dependency) => {
      const target = dependency.targetComponent;
      const targetId = String(target.componentId);
      const pathIds = node.path.split('/').map((segment) => segment.split(':').at(-1));
      return {
        component: this.toComponentRecord(target),
        dependency: {
          _mockId: `api-dependency-${dependency.dependencyId}`,
          dependency_id: dependency.dependencyId,
          origin_component_id: Number(currentId),
          target_component_id: target.componentId,
          dependency_type_id: dependency.dependencyType.dependencyTypeId,
          dependency_type_code: dependency.dependencyType.typeCode,
          dependency_type_name: dependency.dependencyType.typeName,
          dependency_scope: dependency.dependencyScope,
          criticality: dependency.criticality,
          description: dependency.description,
          created_at: dependency.createdAt,
        },
        path: `${node.path}/${dependency.dependencyId}:${targetId}`,
        children: null,
        expanded: false,
        cycle: pathIds.includes(targetId) || currentId === targetId,
      };
    });
    node.expanded = true;
  }

  private toComponentRecord(component: DependencyExplorerComponent): MockRecord {
    return {
      _mockId: `api-${component.componentId}`,
      component_id: component.componentId,
      component_type: component.componentType,
      component_type_label: component.componentTypeLabel,
      name: component.name,
      acronym: component.acronym ?? '',
      description: component.description,
      is_active: component.isActive,
    };
  }

  private toCardDetails(component: DependencyExplorerComponent): ComponentCardDetails {
    return {
      description: component.description ?? '',
      subtype: this.subtypeDetails(component.subtype),
      people: component.responsibilities.map((responsibility) => ({
        name: responsibility.fullName,
        role: responsibility.roleName,
      })),
      technologies: component.technologies.map((technology) => {
        const version = technology.version?.trim();
        return `${technology.name}${version ? ` · ${version}` : ''}`;
      }),
      deployments: component.deployments.map((deployment) =>
        [this.displayLabel(deployment.environment), deployment.url]
          .filter(Boolean)
          .join(' · '),
      ),
    };
  }

  private subtypeDetails(subtype: DependencyExplorerSubtype | null): Array<{
    label: string;
    value: string;
  }> {
    if (!subtype) return [];

    const fields: Array<{ label: string; value: string | null }> =
      subtype.type === 'SYSTEM'
        ? [
            { label: 'Objetivo', value: subtype.businessObjective },
            { label: 'Área propietaria', value: subtype.ownerArea },
            { label: 'Criticidad', value: subtype.criticality },
            { label: 'Estado del sistema', value: subtype.systemStatus },
            { label: 'Puesta en producción', value: subtype.goLiveDate },
            { label: 'Fin de vida', value: subtype.endOfLifeDate },
          ]
        : subtype.type === 'API'
          ? [
              { label: 'Versión', value: subtype.apiVersion },
              { label: 'URL', value: subtype.url },
              { label: 'Protocolo', value: subtype.protocol },
              { label: 'Autenticación', value: subtype.authenticationMethod },
              { label: 'SLA', value: subtype.slaDescription },
            ]
          : subtype.type === 'DATABASE'
            ? [
                { label: 'Motor', value: subtype.engine },
                { label: 'Versión', value: subtype.engineVersion },
                { label: 'Instancia', value: subtype.instanceName },
                { label: 'Esquema', value: subtype.schemaName },
              ]
            : [
                { label: 'Hostname', value: subtype.hostname },
                { label: 'Dirección IP', value: subtype.ipAddress },
                { label: 'Sistema operativo', value: subtype.operatingSystem },
                { label: 'Alojamiento', value: subtype.hostingModel },
              ];

    return fields
      .filter((field): field is { label: string; value: string } => Boolean(field.value))
      .map((field) => ({ label: field.label, value: this.displayLabel(field.value) }));
  }

  private displayLabel(value: string): string {
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
    return labels[value] ?? value.replaceAll('_', ' ');
  }
}
