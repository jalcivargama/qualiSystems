import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import { CatalogComponent } from '../../../catalogo-principal/components/componentes/models/component.model';
import { DependenciesService } from '../dependencias/dependencies.service';
import { Dependency } from '../dependencias/models/dependency.model';
import { DataFlowsService } from './data-flows.service';
import { DataFlow, DataFlowRequest, Sensitivity } from './models/data-flow.model';

type DataFlowRow = DataFlow & { _rowId: string };

type DataFlowForm = {
  dependencyId: number | null;
  dataName: string;
  periodicity: string;
  sensitivity: Sensitivity | '';
  dataFormat: string;
  description: string;
};

@Component({
  selector: 'app-flujos-de-datos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './flujos-de-datos.component.html',
  styleUrl: './flujos-de-datos.component.css',
})
export class FlujosDeDatosComponent implements OnInit {
  private readonly dataFlowsService = inject(DataFlowsService);
  private readonly dependenciesService = inject(DependenciesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly sensitivityOptions: { value: Sensitivity; label: string }[] = [
    { value: 'PUBLIC', label: 'PÚBLICA' },
    { value: 'INTERNAL', label: 'INTERNA' },
    { value: 'CONFIDENTIAL', label: 'CONFIDENCIAL' },
    { value: 'RESTRICTED', label: 'RESTRINGIDA' },
  ];

  private readonly sensitivityLabels = Object.fromEntries(
    this.sensitivityOptions.map((option) => [option.value, option.label]),
  ) as Record<Sensitivity, string>;

  readonly rows = signal<DataFlowRow[]>([]);
  readonly dependencies = signal<Dependency[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: DataFlowForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.dataFlowId,
        this.dependencyLabel(row.dependencyId),
        row.dataName,
        row.periodicity,
        this.labelForSensitivity(row.sensitivity),
        row.dataFormat,
        row.description,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDataFlows();
    this.loadDependencies();
    this.loadComponents();
  }

  get canSubmit(): boolean {
    return this.form.dependencyId != null && this.form.dataName.trim().length > 0;
  }

  onDependencyIdChange(value: number | string | null): void {
    this.form.dependencyId = this.toId(value);
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || String(componentId);
  }

  dependencyLabel(dependencyId: number | null | undefined): string {
    if (dependencyId == null) return '—';
    const dependency = this.dependencies().find(
      (item) => Number(item.dependencyId) === Number(dependencyId),
    );
    if (!dependency) return String(dependencyId);
    const origin = this.componentName(dependency.originComponentId);
    const target = this.componentName(dependency.targetComponentId);
    return `#${dependency.dependencyId}: ${origin} → ${target}`;
  }

  labelForSensitivity(value: string | null | undefined): string {
    if (!value) return '—';
    return this.sensitivityLabels[value as Sensitivity] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadDependencies();
    this.loadComponents();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const dependencyId = this.toId(this.form.dependencyId);
    const dataName = this.form.dataName.trim();
    const periodicity = this.form.periodicity.trim();
    const dataFormat = this.form.dataFormat.trim();
    const description = this.form.description.trim();

    if (dependencyId == null || !dataName) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (dataName.length > 200) {
      this.formError.set('El dato intercambiado no puede superar 200 caracteres.');
      return;
    }

    if (periodicity.length > 100) {
      this.formError.set('La periodicidad no puede superar 100 caracteres.');
      return;
    }

    if (dataFormat.length > 100) {
      this.formError.set('El formato no puede superar 100 caracteres.');
      return;
    }

    const body: DataFlowRequest = { dependencyId, dataName };
    if (periodicity) body.periodicity = periodicity;
    if (this.form.sensitivity) body.sensitivity = this.form.sensitivity;
    if (dataFormat) body.dataFormat = dataFormat;
    if (description) body.description = description;

    this.saving.set(true);
    this.formError.set('');

    this.dataFlowsService.createDataFlow(body).subscribe({
      next: () => {
        this.toastService.success('Flujo de datos creado correctamente');
        this.closeModal();
        this.loadDataFlows();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadDataFlows(): void {
    this.loading.set(true);
    this.dataFlowsService.getAllDataFlows().subscribe({
      next: (flows) => {
        this.rows.set(flows.map((flow) => this.toRow(flow)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private loadDependencies(): void {
    this.dependenciesService.getAllDependencies().subscribe({
      next: (dependencies) => {
        this.dependencies.set(Array.isArray(dependencies) ? dependencies : []);
      },
      error: () => {
        this.dependencies.set([]);
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

  private toRow(flow: DataFlow): DataFlowRow {
    return {
      ...flow,
      _rowId: `data-flow-${flow.dataFlowId ?? `${flow.dependencyId}-${flow.dataName}`}`,
    };
  }

  private emptyForm(): DataFlowForm {
    return {
      dependencyId: null,
      dataName: '',
      periodicity: '',
      sensitivity: '',
      dataFormat: '',
      description: '',
    };
  }

  private toId(value: number | string | null | undefined): number | null {
    if (value == null || value === '') return null;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }

  private resolveErrorMessage(error: HttpErrorResponse, action: 'list' | 'create'): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    if (error.status === 409) {
      return 'Conflicto: la dependencia no existe o hay una restricción en base de datos.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    return action === 'list'
      ? 'No fue posible cargar los flujos de datos.'
      : 'No fue posible crear el flujo de datos.';
  }
}
