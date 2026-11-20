import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../componentes/components.service';
import { CatalogComponent } from '../componentes/models/component.model';
import { InfrastructureDetailsService } from './infrastructure-details.service';
import {
  HostingModel,
  InfrastructureDetail,
  InfrastructureDetailRequest,
  InfrastructureDetailUpdateRequest,
} from './models/infrastructure-detail.model';

type InfrastructureRow = InfrastructureDetail & { _rowId: string };

type InfrastructureForm = {
  componentId: number | null;
  hostname: string;
  ipAddress: string;
  operatingSystem: string;
  hostingModel: HostingModel | '';
};

@Component({
  selector: 'app-infraestructura',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infraestructura.component.html',
  styleUrl: './infraestructura.component.css',
})
export class InfraestructuraComponent implements OnInit {
  private readonly infrastructureDetailsService = inject(InfrastructureDetailsService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly hostingModelOptions: { value: HostingModel; label: string }[] = [
    { value: 'CLOUD', label: 'NUBE' },
    { value: 'ON_PREMISE', label: 'ON PREMISE' },
  ];

  private readonly hostingModelLabels = Object.fromEntries(
    this.hostingModelOptions.map((option) => [option.value, option.label]),
  ) as Record<HostingModel, string>;

  readonly rows = signal<InfrastructureRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingComponentId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: InfrastructureForm = this.emptyForm();

  readonly availableInfrastructureComponents = computed(() => {
    const editingId = this.editingComponentId();
    const usedIds = new Set(
      this.rows()
        .map((row) => Number(row.componentId))
        .filter((id) => Number.isFinite(id) && id !== editingId),
    );
    return this.components().filter((component) => {
      const type = String(component.componentType ?? '').trim().toUpperCase();
      const active = String(component.isActive ?? '').trim().toUpperCase();
      const id = Number(component.componentId);
      return type === 'INFRASTRUCTURE' && active === 'Y' && Number.isFinite(id) && !usedIds.has(id);
    });
  });

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        row.hostname,
        row.ipAddress,
        row.operatingSystem,
        this.labelForHostingModel(row.hostingModel),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadInfrastructureDetails();
    this.loadComponents();
  }

  get canSubmit(): boolean {
    const componentId = this.resolveComponentId() ?? this.editingComponentId();
    return componentId != null;
  }

  onComponentIdChange(value: number | string | null): void {
    this.form.componentId = this.toComponentId(value);
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || '—';
  }

  labelForHostingModel(value: string | null | undefined): string {
    if (!value) return '—';
    return this.hostingModelLabels[value as HostingModel] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingComponentId.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
  }

  openEdit(row: InfrastructureRow): void {
    const componentId = this.toComponentId(row.componentId);
    this.isEditing.set(true);
    this.editingComponentId.set(componentId);
    this.form = {
      componentId,
      hostname: row.hostname ?? '',
      ipAddress: row.ipAddress ?? '',
      operatingSystem: row.operatingSystem ?? '',
      hostingModel: (row.hostingModel as HostingModel | null) ?? '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingComponentId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const componentId = this.resolveComponentId() ?? this.editingComponentId();
    if (componentId == null) {
      this.formError.set('Selecciona un componente INFRAESTRUCTURA.');
      return;
    }

    const hostname = this.form.hostname.trim();
    const ipAddress = this.form.ipAddress.trim();
    const operatingSystem = this.form.operatingSystem.trim();
    const hostingModel = this.form.hostingModel;

    if (hostname.length > 255) {
      this.formError.set('El hostname no puede superar 255 caracteres.');
      return;
    }
    if (ipAddress.length > 45) {
      this.formError.set('La dirección IP no puede superar 45 caracteres.');
      return;
    }
    if (operatingSystem.length > 200) {
      this.formError.set('El sistema operativo no puede superar 200 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    this.form.componentId = componentId;

    if (this.isEditing()) {
      const updateBody: InfrastructureDetailUpdateRequest = {
        componentId,
        hostname: hostname || null,
        ipAddress: ipAddress || null,
        operatingSystem: operatingSystem || null,
        hostingModel: hostingModel || null,
      };

      this.infrastructureDetailsService.updateInfrastructureDetail(componentId, updateBody).subscribe({
        next: () => {
          this.toastService.success('Detalle de infraestructura actualizado correctamente');
          this.closeModal();
          this.loadInfrastructureDetails();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: InfrastructureDetailRequest = { componentId };
    if (hostname) createBody.hostname = hostname;
    if (ipAddress) createBody.ipAddress = ipAddress;
    if (operatingSystem) createBody.operatingSystem = operatingSystem;
    if (hostingModel) createBody.hostingModel = hostingModel;

    this.infrastructureDetailsService.createInfrastructureDetail(createBody).subscribe({
      next: () => {
        this.toastService.success('Detalle de infraestructura creado correctamente');
        this.closeModal();
        this.loadInfrastructureDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadInfrastructureDetails(): void {
    this.loading.set(true);
    this.infrastructureDetailsService.getAllInfrastructureDetails().subscribe({
      next: (details) => {
        this.rows.set(details.map((detail) => this.toRow(detail)));
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

  private toRow(detail: InfrastructureDetail): InfrastructureRow {
    return {
      ...detail,
      _rowId: `infra-${detail.componentId}`,
    };
  }

  private emptyForm(): InfrastructureForm {
    return {
      componentId: null,
      hostname: '',
      ipAddress: '',
      operatingSystem: '',
      hostingModel: '',
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
    action: 'list' | 'create' | 'update',
  ): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    if (error.status === 404) return 'El detalle de infraestructura no existe o ya fue eliminado.';
    if (error.status === 409) {
      return action === 'update'
        ? 'No se puede actualizar por restricciones relacionadas.'
        : 'Conflicto: el componente ya tiene detalle o no es de tipo INFRAESTRUCTURA.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los detalles de infraestructura.';
    if (action === 'update') return 'No fue posible actualizar el detalle de infraestructura.';
    return 'No fue posible crear el detalle de infraestructura.';
  }
}
