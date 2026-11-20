import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import { CatalogComponent } from '../../../catalogo-principal/components/componentes/models/component.model';
import { DependencyTypesService } from '../tipos-de-dependencia/dependency-types.service';
import { DependencyType } from '../tipos-de-dependencia/models/dependency-type.model';
import { DependenciesService } from './dependencies.service';
import {
  Criticality,
  Dependency,
  DependencyRequest,
  DependencyScope,
} from './models/dependency.model';

type DependencyRow = Dependency & { _rowId: string };

type DependencyForm = {
  originComponentId: number | null;
  targetComponentId: number | null;
  dependencyTypeId: number | null;
  dependencyScope: DependencyScope | '';
  criticality: Criticality | '';
  description: string;
};

@Component({
  selector: 'app-dependencias',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dependencias.component.html',
  styleUrl: './dependencias.component.css',
})
export class DependenciasComponent implements OnInit {
  private readonly dependenciesService = inject(DependenciesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly dependencyTypesService = inject(DependencyTypesService);
  private readonly toastService = inject(ToastService);

  readonly scopeOptions: { value: DependencyScope; label: string }[] = [
    { value: 'INTERNAL', label: 'INTERNA' },
    { value: 'EXTERNAL', label: 'EXTERNA' },
  ];

  readonly criticalityOptions: { value: Criticality; label: string }[] = [
    { value: 'LOW', label: 'BAJA' },
    { value: 'MEDIUM', label: 'MEDIA' },
    { value: 'HIGH', label: 'ALTA' },
    { value: 'CRITICAL', label: 'CRÍTICA' },
  ];

  private readonly scopeLabels = Object.fromEntries(
    this.scopeOptions.map((option) => [option.value, option.label]),
  ) as Record<DependencyScope, string>;

  private readonly criticalityLabels = Object.fromEntries(
    this.criticalityOptions.map((option) => [option.value, option.label]),
  ) as Record<Criticality, string>;

  readonly rows = signal<DependencyRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly dependencyTypes = signal<DependencyType[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingDependencyId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly selectedOriginId = signal<number | null>(null);
  form: DependencyForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.dependencyId,
        this.componentName(row.originComponentId),
        this.componentName(row.targetComponentId),
        this.dependencyTypeName(row.dependencyTypeId),
        this.labelForScope(row.dependencyScope),
        this.labelForCriticality(row.criticality),
        row.description,
        row.createdAt,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  readonly availableTargetComponents = computed(() => {
    const originId = this.selectedOriginId();
    return this.components().filter(
      (component) => Number(component.componentId) !== Number(originId),
    );
  });

  ngOnInit(): void {
    this.loadDependencies();
    this.loadComponents();
    this.loadDependencyTypes();
  }

  get canSubmit(): boolean {
    return (
      this.form.originComponentId != null &&
      this.form.targetComponentId != null &&
      this.form.dependencyTypeId != null &&
      !!this.form.dependencyScope &&
      this.form.originComponentId !== this.form.targetComponentId
    );
  }

  onOriginComponentIdChange(value: number | string | null): void {
    this.form.originComponentId = this.toId(value);
    this.selectedOriginId.set(this.form.originComponentId);
    if (
      this.form.originComponentId != null &&
      this.form.originComponentId === this.form.targetComponentId
    ) {
      this.form.targetComponentId = null;
    }
  }

  onTargetComponentIdChange(value: number | string | null): void {
    this.form.targetComponentId = this.toId(value);
  }

  onDependencyTypeIdChange(value: number | string | null): void {
    this.form.dependencyTypeId = this.toId(value);
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || String(componentId);
  }

  dependencyTypeName(dependencyTypeId: number | null | undefined): string {
    if (dependencyTypeId == null) return '—';
    const match = this.dependencyTypes().find(
      (type) => Number(type.dependencyTypeId) === Number(dependencyTypeId),
    );
    return match?.typeName?.trim() || String(dependencyTypeId);
  }

  labelForScope(value: string | null | undefined): string {
    if (!value) return '—';
    return this.scopeLabels[value as DependencyScope] ?? value;
  }

  labelForCriticality(value: string | null | undefined): string {
    if (!value) return '—';
    return this.criticalityLabels[value as Criticality] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingDependencyId.set(null);
    this.form = this.emptyForm();
    this.selectedOriginId.set(null);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
    this.loadDependencyTypes();
  }

  openEdit(row: DependencyRow): void {
    const originComponentId = this.toId(row.originComponentId);
    this.isEditing.set(true);
    this.editingDependencyId.set(this.toId(row.dependencyId));
    this.form = {
      originComponentId,
      targetComponentId: this.toId(row.targetComponentId),
      dependencyTypeId: this.toId(row.dependencyTypeId),
      dependencyScope: row.dependencyScope ?? 'INTERNAL',
      criticality: (row.criticality as Criticality | null) ?? '',
      description: row.description ?? '',
    };
    this.selectedOriginId.set(originComponentId);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
    this.loadDependencyTypes();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingDependencyId.set(null);
    this.selectedOriginId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const originComponentId = this.toId(this.form.originComponentId);
    const targetComponentId = this.toId(this.form.targetComponentId);
    const dependencyTypeId = this.toId(this.form.dependencyTypeId);
    const dependencyScope = this.form.dependencyScope;

    if (
      originComponentId == null ||
      targetComponentId == null ||
      dependencyTypeId == null ||
      !dependencyScope
    ) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (originComponentId === targetComponentId) {
      this.formError.set('El componente destino debe ser distinto del origen.');
      return;
    }

    const description = this.form.description.trim();

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const id = this.editingDependencyId();
      if (id == null) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar la dependencia a actualizar.');
        return;
      }

      const updateBody: DependencyRequest = {
        originComponentId,
        targetComponentId,
        dependencyTypeId,
        dependencyScope,
        criticality: this.form.criticality || null,
        description: description || null,
      };

      this.dependenciesService.updateDependency(id, updateBody).subscribe({
        next: () => {
          this.toastService.success('Dependencia actualizada correctamente');
          this.closeModal();
          this.loadDependencies();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: DependencyRequest = {
      originComponentId,
      targetComponentId,
      dependencyTypeId,
      dependencyScope,
    };
    if (this.form.criticality) createBody.criticality = this.form.criticality;
    if (description) createBody.description = description;

    this.dependenciesService.createDependency(createBody).subscribe({
      next: () => {
        this.toastService.success('Dependencia creada correctamente');
        this.closeModal();
        this.loadDependencies();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadDependencies(): void {
    this.loading.set(true);
    this.dependenciesService.getAllDependencies().subscribe({
      next: (dependencies) => {
        this.rows.set(dependencies.map((dependency) => this.toRow(dependency)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private loadComponents(): void {
    this.componentsService.getComponents().subscribe({
      next: (components) => {
        this.components.set(Array.isArray(components) ? components : []);
      },
      error: () => {
        this.components.set([]);
      },
    });
  }

  private loadDependencyTypes(): void {
    this.dependencyTypesService.getAllDependencyTypes().subscribe({
      next: (types) => {
        this.dependencyTypes.set(Array.isArray(types) ? types : []);
      },
      error: () => {
        this.dependencyTypes.set([]);
      },
    });
  }

  private toRow(dependency: Dependency): DependencyRow {
    return {
      ...dependency,
      _rowId: `dep-${dependency.dependencyId ?? `${dependency.originComponentId}-${dependency.targetComponentId}`}`,
    };
  }

  private emptyForm(): DependencyForm {
    return {
      originComponentId: null,
      targetComponentId: null,
      dependencyTypeId: null,
      dependencyScope: 'INTERNAL',
      criticality: '',
      description: '',
    };
  }

  private toId(value: number | string | null | undefined): number | null {
    if (value == null || value === '') return null;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }

  private resolveErrorMessage(
    error: HttpErrorResponse,
    action: 'list' | 'create' | 'update',
  ): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    if (error.status === 404) return 'La dependencia no existe o ya fue eliminada.';
    if (error.status === 409) {
      return 'Conflicto: revisa que origen, destino y tipo existan y no violen restricciones.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar las dependencias.';
    if (action === 'update') return 'No fue posible actualizar la dependencia.';
    return 'No fue posible crear la dependencia.';
  }
}
