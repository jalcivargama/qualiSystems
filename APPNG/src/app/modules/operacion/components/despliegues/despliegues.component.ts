import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { SearchableSelectComponent } from '../../../../shared/ui/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../../shared/ui/searchable-select/searchable-select.models';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import { CatalogComponent } from '../../../catalogo-principal/components/componentes/models/component.model';
import { SystemDetailsService } from '../../../catalogo-principal/components/sistemas/system-details.service';
import { SystemDetail } from '../../../catalogo-principal/components/sistemas/models/system-detail.model';
import { SystemDeploymentsService } from './system-deployments.service';
import {
  Environment,
  SystemDeployment,
  SystemDeploymentRequest,
  SystemDeploymentUpdateRequest,
} from './models/system-deployment.model';

type DeploymentRow = SystemDeployment & { _rowId: string };

type DeploymentForm = {
  componentId: number | null;
  environment: Environment | '';
  url: string;
};

@Component({
  selector: 'app-despliegues',
  imports: [CommonModule, FormsModule, RouterLink, SearchableSelectComponent],
  templateUrl: './despliegues.component.html',
  styleUrl: './despliegues.component.css',
})
export class DesplieguesComponent implements OnInit {
  private readonly systemDeploymentsService = inject(SystemDeploymentsService);
  private readonly systemDetailsService = inject(SystemDetailsService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly environmentOptions: { value: Environment; label: string }[] = [
    { value: 'DEVELOPMENT', label: 'DESARROLLO' },
    { value: 'QA', label: 'QA' },
    { value: 'PRODUCTION', label: 'PRODUCCIÓN' },
  ];

  private readonly environmentLabels: Record<Environment, string> = {
    DEVELOPMENT: 'DESARROLLO',
    TEST: 'PRUEBAS',
    QA: 'QA',
    STAGING: 'STAGING',
    PRODUCTION: 'PRODUCCIÓN',
    DR: 'DR',
  };

  readonly rows = signal<DeploymentRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly systemDetails = signal<SystemDetail[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingDeploymentId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formError = signal('');
  readonly selectedComponentId = signal<number | null>(null);
  form: DeploymentForm = this.emptyForm();

  readonly availableSystems = computed(() => {
    return this.systemDetails()
      .map((detail) => {
        const componentId = Number(detail.componentId);
        if (!Number.isFinite(componentId)) return null;
        return { componentId, name: this.componentName(componentId) };
      })
      .filter((item): item is { componentId: number; name: string } => item != null)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });

  readonly systemOptions = computed<SearchableSelectOption[]>(() =>
    this.availableSystems().map((system) => ({
      value: system.componentId,
      label: system.name,
      group: 'SISTEMA',
    })),
  );

  readonly availableEnvironments = computed(() => {
    const componentId = this.selectedComponentId();
    const editingId = this.editingDeploymentId();
    const used = new Set(
      this.rows()
        .filter(
          (row) =>
            componentId != null &&
            Number(row.componentId) === componentId &&
            (editingId == null || Number(row.deploymentId) !== editingId),
        )
        .map((row) => row.environment),
    );

    const options = [...this.environmentOptions];
    const current = this.form.environment;
    if (
      current &&
      !options.some((option) => option.value === current) &&
      this.environmentLabels[current]
    ) {
      options.unshift({ value: current, label: this.environmentLabels[current] });
    }

    if (componentId == null) return options;
    return options.filter((option) => !used.has(option.value));
  });

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.deploymentId,
        this.componentName(row.componentId),
        this.labelForEnvironment(row.environment),
        row.url,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDeployments();
    this.loadComponents();
    this.loadSystemDetails();
  }

  get canSubmit(): boolean {
    const componentId = this.resolveComponentId() ?? this.selectedComponentId();
    return componentId != null && !!this.form.environment;
  }

  onComponentIdChange(value: number | string | null): void {
    const componentId = this.toComponentId(value);
    this.form.componentId = componentId;
    this.selectedComponentId.set(componentId);
    if (
      this.form.environment &&
      !this.availableEnvironments().some((option) => option.value === this.form.environment)
    ) {
      this.form.environment = '';
    }
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || '—';
  }

  labelForEnvironment(value: string | null | undefined): string {
    if (!value) return '—';
    return this.environmentLabels[value as Environment] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingDeploymentId.set(null);
    this.form = this.emptyForm();
    this.selectedComponentId.set(null);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadSystemDetails();
    this.loadComponents();
  }

  openEdit(row: DeploymentRow): void {
    const componentId = this.toComponentId(row.componentId);
    this.isEditing.set(true);
    this.editingDeploymentId.set(row.deploymentId ?? null);
    this.form = {
      componentId,
      environment: row.environment ?? '',
      url: row.url ?? '',
    };
    this.selectedComponentId.set(componentId);
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingDeploymentId.set(null);
    this.selectedComponentId.set(null);
    this.formError.set('');
    this.saving.set(false);
    this.deleting.set(false);
  }

  deleteCurrent(): void {
    if (!this.isEditing() || this.saving() || this.deleting()) return;

    const id = this.editingDeploymentId();
    if (id == null) {
      this.toastService.error('No se pudo identificar el despliegue a eliminar.');
      return;
    }

    const system = this.componentName(this.form.componentId);
    const environment = this.labelForEnvironment(this.form.environment);
    const label =
      system !== '—' || environment !== '—'
        ? `${system !== '—' ? system : id} / ${environment !== '—' ? environment : '—'}`
        : String(id);

    if (!window.confirm(`¿Eliminar el despliegue "${label}"?`)) {
      return;
    }

    this.deleting.set(true);
    this.formError.set('');

    this.systemDeploymentsService.deleteSystemDeployment(id).subscribe({
      next: () => {
        this.toastService.success('Despliegue eliminado correctamente');
        this.closeModal();
        this.loadDeployments();
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'delete'));
      },
    });
  }

  save(): void {
    if (this.saving() || this.deleting() || !this.canSubmit) return;

    const componentId = this.resolveComponentId() ?? this.selectedComponentId();
    const environment = this.form.environment;
    if (componentId == null || !environment) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    const url = this.form.url.trim();
    if (url.length > 2000) {
      this.formError.set('La URL no puede superar 2000 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    this.form.componentId = componentId;

    if (this.isEditing()) {
      const id = this.editingDeploymentId();
      if (id == null) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar el despliegue a actualizar.');
        return;
      }

      const updateBody: SystemDeploymentUpdateRequest = {
        componentId,
        environment,
        url: url || null,
      };

      this.systemDeploymentsService.updateSystemDeployment(id, updateBody).subscribe({
        next: () => {
          this.toastService.success('Despliegue actualizado correctamente');
          this.closeModal();
          this.loadDeployments();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: SystemDeploymentRequest = { componentId, environment };
    if (url) createBody.url = url;

    this.systemDeploymentsService.createSystemDeployment(createBody).subscribe({
      next: () => {
        this.toastService.success('Despliegue creado correctamente');
        this.closeModal();
        this.loadDeployments();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadDeployments(): void {
    this.loading.set(true);
    this.systemDeploymentsService.getAllSystemDeployments().subscribe({
      next: (deployments) => {
        this.rows.set(deployments.map((deployment) => this.toRow(deployment)));
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

  private loadSystemDetails(): void {
    this.systemDetailsService.getAllSystemDetails().subscribe({
      next: (details) => {
        this.systemDetails.set(Array.isArray(details) ? details : []);
      },
      error: () => {
        this.systemDetails.set([]);
      },
    });
  }

  private toRow(deployment: SystemDeployment): DeploymentRow {
    return {
      ...deployment,
      _rowId: `dep-${deployment.deploymentId ?? `${deployment.componentId}-${deployment.environment}`}`,
    };
  }

  private emptyForm(): DeploymentForm {
    return {
      componentId: null,
      environment: '',
      url: '',
    };
  }

  private resolveComponentId(): number | null {
    return this.toComponentId(this.form.componentId);
  }

  private toComponentId(value: number | string | null | undefined): number | null {
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
    if (error.status === 404) return 'El despliegue no existe o ya fue eliminado.';
    if (error.status === 409) {
      return action === 'delete'
        ? 'No se puede eliminar: el despliegue tiene registros relacionados.'
        : 'Conflicto: ese sistema ya tiene despliegue en el ambiente, o el system-detail no existe.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los despliegues.';
    if (action === 'update') return 'No fue posible actualizar el despliegue.';
    if (action === 'delete') return 'No fue posible eliminar el despliegue.';
    return 'No fue posible crear el despliegue.';
  }
}
