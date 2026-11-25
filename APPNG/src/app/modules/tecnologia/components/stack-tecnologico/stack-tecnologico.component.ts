import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { SearchableSelectComponent } from '../../../../shared/ui/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../../shared/ui/searchable-select/searchable-select.models';
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
  technologyIds: number[];
  version: string;
  isPrimary: ActiveFlag;
};

@Component({
  selector: 'app-stack-tecnologico',
  imports: [CommonModule, FormsModule, RouterLink, SearchableSelectComponent],
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
  readonly deleting = signal(false);
  readonly formError = signal('');
  readonly selectedComponentId = signal<number | null>(null);
  readonly selectedTechnologyIds = signal<number[]>([]);
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

  readonly componentOptions = computed<SearchableSelectOption[]>(() =>
    this.components()
      .filter((component) => component.componentId != null)
      .map((component) => {
        const typeLabel =
          this.componentTypeLabels[component.componentType as ComponentType] ??
          component.componentType ??
          '';
        return {
          value: Number(component.componentId),
          label: component.name?.trim() || String(component.componentId),
          group: typeLabel,
          searchText: `${component.acronym ?? ''} ${typeLabel}`,
        };
      }),
  );

  readonly technologySelectOptions = computed<SearchableSelectOption[]>(() =>
    this.technologies()
      .filter((technology) => technology.technologyId != null)
      .map((technology) => ({
        value: Number(technology.technologyId),
        label: technology.name?.trim() || String(technology.technologyId),
        group:
          this.categoryLabels[technology.category as TechnologyCategory] ??
          technology.category ??
          '',
      })),
  );

  readonly usedTechnologyIdsForComponent = computed(() => {
    const componentId = this.selectedComponentId();
    const editingTechnologyId = this.isEditing() ? this.form.technologyId : null;
    return new Set(
      this.rows()
        .filter((row) => Number(row.componentId) === Number(componentId))
        .map((row) => Number(row.technologyId))
        .filter((id) => id !== Number(editingTechnologyId)),
    );
  });

  readonly availableTechnologies = computed(() => {
    const used = this.usedTechnologyIdsForComponent();
    const selected = new Set(this.selectedTechnologyIds());
    return this.technologies().filter((technology) => {
      const id = Number(technology.technologyId);
      return Number.isFinite(id) && !used.has(id) && !selected.has(id);
    });
  });

  readonly selectedTechnologies = computed(() => {
    const selected = new Set(this.selectedTechnologyIds());
    return this.technologies().filter(
      (technology) => technology.technologyId != null && selected.has(technology.technologyId),
    );
  });

  ngOnInit(): void {
    this.loadComponentTechnologies();
    this.loadComponents();
    this.loadTechnologies();
  }

  get canSubmit(): boolean {
    if (this.form.componentId == null || !this.form.isPrimary) return false;
    if (this.isEditing()) return this.form.technologyId != null;
    return this.selectedTechnologyIds().length > 0;
  }

  onComponentIdChange(value: number | string | null): void {
    if (this.isEditing()) return;
    this.form.componentId = this.toId(value);
    this.selectedComponentId.set(this.form.componentId);
    this.form.technologyId = null;
    this.form.technologyIds = [];
    this.selectedTechnologyIds.set([]);
  }

  toggleTechnology(technologyId: number): void {
    if (this.isEditing()) return;
    this.selectedTechnologyIds.update((ids) => {
      const next = ids.includes(technologyId)
        ? ids.filter((id) => id !== technologyId)
        : [...ids, technologyId];
      this.form.technologyIds = next;
      return next;
    });
  }

  removeTechnology(technologyId: number): void {
    if (this.isEditing()) return;
    this.selectedTechnologyIds.update((ids) => {
      const next = ids.filter((id) => id !== technologyId);
      this.form.technologyIds = next;
      return next;
    });
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
    this.selectedTechnologyIds.set([]);
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
      technologyIds: technologyId != null ? [technologyId] : [],
      version: row.version ?? '',
      isPrimary: row.isPrimary ?? 'N',
    };
    this.selectedComponentId.set(componentId);
    this.selectedTechnologyIds.set(technologyId != null ? [technologyId] : []);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
    this.loadTechnologies();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.selectedComponentId.set(null);
    this.selectedTechnologyIds.set([]);
    this.formError.set('');
    this.saving.set(false);
    this.deleting.set(false);
  }

  deleteCurrent(): void {
    if (!this.isEditing() || this.saving() || this.deleting()) return;

    const componentId = this.toId(this.form.componentId);
    const technologyId = this.toId(this.form.technologyId);
    if (componentId == null || technologyId == null) {
      this.toastService.error('No se pudo identificar la relación a eliminar.');
      return;
    }

    const label = `${this.componentName(componentId)} / ${this.technologyName(technologyId)}`;
    if (!window.confirm(`¿Eliminar la tecnología de componente "${label}"?`)) {
      return;
    }

    this.deleting.set(true);
    this.formError.set('');

    this.componentTechnologiesService.deleteComponentTechnology(componentId, technologyId).subscribe({
      next: () => {
        this.toastService.success('Tecnología de componente eliminada correctamente');
        this.closeModal();
        this.loadComponentTechnologies();
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'delete'));
      },
    });
  }

  save(): void {
    if (this.saving() || this.deleting() || !this.canSubmit) return;

    const componentId = this.toId(this.form.componentId);

    if (componentId == null || !this.form.isPrimary) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    const version = this.isEditing() ? this.form.version.trim() : '';
    if (version.length > 100) {
      this.formError.set('La versión no puede superar 100 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const technologyId = this.toId(this.form.technologyId);
      if (technologyId == null) {
        this.saving.set(false);
        this.formError.set('Completa los campos obligatorios.');
        return;
      }

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

    const technologies = [...this.selectedTechnologyIds()];
    if (technologies.length === 0) {
      this.saving.set(false);
      this.formError.set('Selecciona al menos una tecnología.');
      return;
    }

    this.componentTechnologiesService
      .createComponentTechnologiesBatch({
        componentId,
        technologies,
        version: '',
        isPrimary: this.form.isPrimary,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Stack tecnológico creado correctamente');
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
      technologyIds: [],
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
    action: 'list' | 'create' | 'update' | 'delete',
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
      return action === 'delete'
        ? 'No se puede eliminar: la relación tiene dependencias asociadas.'
        : 'Conflicto: la relación ya existe o el componente/tecnología no es válido.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar el stack tecnológico.';
    if (action === 'update') return 'No fue posible actualizar la tecnología de componente.';
    if (action === 'delete') return 'No fue posible eliminar la tecnología de componente.';
    return 'No fue posible crear el stack tecnológico.';
  }
}
