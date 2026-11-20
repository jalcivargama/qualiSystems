import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import {
  CatalogComponent,
  ComponentType,
} from '../../../catalogo-principal/components/componentes/models/component.model';
import { TechnologiesService } from '../tecnologias/technologies.service';
import { Technology, TechnologyCategory } from '../tecnologias/models/technology.model';
import { ComponentTechnologiesService } from './component-technologies.service';
import {
  ActiveFlag,
  ComponentTechnology,
  ComponentTechnologyUpdateRequest,
} from './models/component-technology.model';

type ComponentTechnologyRow = ComponentTechnology & { _rowId: string };

type ComponentTechnologyForm = {
  componentId: number | null;
  technologyId: number | null;
  version: string;
  isPrimary: ActiveFlag;
};

@Component({
  selector: 'app-stack-tecnologico',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stack-tecnologico.component.html',
  styleUrl: './stack-tecnologico.component.css',
})
export class StackTecnologicoComponent implements OnInit {
  private readonly componentTechnologiesService = inject(ComponentTechnologiesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly technologiesService = inject(TechnologiesService);
  private readonly toastService = inject(ToastService);

  readonly primaryOptions: { value: ActiveFlag; label: string }[] = [
    { value: 'Y', label: 'SÍ' },
    { value: 'N', label: 'NO' },
  ];

  private readonly primaryLabels = Object.fromEntries(
    this.primaryOptions.map((option) => [option.value, option.label]),
  ) as Record<ActiveFlag, string>;

  private readonly componentTypeLabels: Record<ComponentType, string> = {
    SYSTEM: 'SISTEMA',
    API: 'API',
    DATABASE: 'BASE DE DATOS',
    INFRASTRUCTURE: 'INFRAESTRUCTURA',
    EXTERNAL_SERVICE: 'SERVICIO EXTERNO',
    MESSAGING: 'MENSAJERÍA',
  };

  private readonly categoryLabels: Record<TechnologyCategory, string> = {
    LANGUAGE: 'LENGUAJE',
    FRAMEWORK: 'FRAMEWORK',
    DATABASE: 'BASE DE DATOS',
    FRONTEND: 'FRONTEND',
    BACKEND: 'BACKEND',
    MESSAGING: 'MENSAJERÍA',
    CONTAINER: 'CONTENEDOR',
    ORCHESTRATION: 'ORQUESTACIÓN',
    MONITORING: 'MONITOREO',
    OTHER: 'OTRO',
  };

  readonly rows = signal<ComponentTechnologyRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly selectedComponentId = signal<number | null>(null);
  form: ComponentTechnologyForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        this.technologyName(row.technologyId),
        row.version,
        this.labelForPrimary(row.isPrimary),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  readonly availableTechnologies = computed(() => {
    const componentId = this.selectedComponentId();
    const editingTechnologyId = this.isEditing() ? this.form.technologyId : null;
    const usedTechnologyIds = new Set(
      this.rows()
        .filter((row) => Number(row.componentId) === Number(componentId))
        .map((row) => Number(row.technologyId))
        .filter((id) => id !== Number(editingTechnologyId)),
    );
    return this.technologies().filter((technology) => {
      const id = Number(technology.technologyId);
      return Number.isFinite(id) && !usedTechnologyIds.has(id);
    });
  });

  ngOnInit(): void {
    this.loadComponentTechnologies();
    this.loadComponents();
    this.loadTechnologies();
  }

  get canSubmit(): boolean {
    return (
      this.form.componentId != null &&
      this.form.technologyId != null &&
      !!this.form.isPrimary
    );
  }

  onComponentIdChange(value: number | string | null): void {
    if (this.isEditing()) return;
    this.form.componentId = this.toId(value);
    this.selectedComponentId.set(this.form.componentId);
    this.form.technologyId = null;
  }

  onTechnologyIdChange(value: number | string | null): void {
    if (this.isEditing()) return;
    this.form.technologyId = this.toId(value);
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || String(componentId);
  }

  technologyName(technologyId: number | null | undefined): string {
    if (technologyId == null) return '—';
    const match = this.technologies().find(
      (technology) => Number(technology.technologyId) === Number(technologyId),
    );
    return match?.name?.trim() || String(technologyId);
  }

  componentOptionLabel(component: CatalogComponent): string {
    const name = component.name?.trim() || String(component.componentId ?? '—');
    const typeLabel =
      this.componentTypeLabels[component.componentType as ComponentType] ??
      component.componentType;
    return `${name} - ${typeLabel}`;
  }

  technologyOptionLabel(technology: Technology): string {
    const name = technology.name?.trim() || String(technology.technologyId ?? '—');
    const categoryLabel =
      this.categoryLabels[technology.category as TechnologyCategory] ?? technology.category;
    return `${name} - ${categoryLabel}`;
  }

  labelForPrimary(value: string | null | undefined): string {
    if (!value) return '—';
    return this.primaryLabels[value as ActiveFlag] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.form = this.emptyForm();
    this.selectedComponentId.set(null);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
    this.loadTechnologies();
  }

  openEdit(row: ComponentTechnologyRow): void {
    const componentId = this.toId(row.componentId);
    const technologyId = this.toId(row.technologyId);
    this.isEditing.set(true);
    this.form = {
      componentId,
      technologyId,
      version: row.version ?? '',
      isPrimary: row.isPrimary ?? 'N',
    };
    this.selectedComponentId.set(componentId);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
    this.loadTechnologies();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.selectedComponentId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const componentId = this.toId(this.form.componentId);
    const technologyId = this.toId(this.form.technologyId);
    const version = this.form.version.trim();

    if (componentId == null || technologyId == null || !this.form.isPrimary) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (version.length > 100) {
      this.formError.set('La versión no puede superar 100 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const updateBody: ComponentTechnologyUpdateRequest = {
        isPrimary: this.form.isPrimary,
        version: version || null,
      };

      this.componentTechnologiesService
        .updateComponentTechnology(componentId, technologyId, updateBody)
        .subscribe({
          next: () => {
            this.toastService.success('Tecnología de componente actualizada correctamente');
            this.closeModal();
            this.loadComponentTechnologies();
          },
          error: (error: HttpErrorResponse) => {
            this.saving.set(false);
            this.toastService.error(this.resolveErrorMessage(error, 'update'));
          },
        });
      return;
    }

    const createBody: ComponentTechnology = {
      componentId,
      technologyId,
      isPrimary: this.form.isPrimary,
    };
    if (version) createBody.version = version;

    this.componentTechnologiesService.createComponentTechnology(createBody).subscribe({
      next: () => {
        this.toastService.success('Tecnología de componente creada correctamente');
        this.closeModal();
        this.loadComponentTechnologies();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadComponentTechnologies(): void {
    this.loading.set(true);
    this.componentTechnologiesService.getAllComponentTechnologies().subscribe({
      next: (items) => {
        this.rows.set(items.map((item) => this.toRow(item)));
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

  private loadTechnologies(): void {
    this.technologiesService.getAllTechnologies().subscribe({
      next: (technologies) => {
        this.technologies.set(Array.isArray(technologies) ? technologies : []);
      },
      error: () => {
        this.technologies.set([]);
      },
    });
  }

  private toRow(item: ComponentTechnology): ComponentTechnologyRow {
    return {
      ...item,
      _rowId: `stack-${item.componentId}-${item.technologyId}`,
    };
  }

  private emptyForm(): ComponentTechnologyForm {
    return {
      componentId: null,
      technologyId: null,
      version: '',
      isPrimary: 'N',
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
    if (error.status === 404) return 'La relación componente-tecnología no existe o ya fue eliminada.';
    if (error.status === 409) {
      return 'Conflicto: la relación ya existe o el componente/tecnología no es válido.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar el stack tecnológico.';
    if (action === 'update') return 'No fue posible actualizar la tecnología de componente.';
    return 'No fue posible crear la tecnología de componente.';
  }
}
