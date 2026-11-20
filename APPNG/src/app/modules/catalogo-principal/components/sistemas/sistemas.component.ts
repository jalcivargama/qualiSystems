import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../componentes/components.service';
import { CatalogComponent } from '../componentes/models/component.model';
import { SystemDetailsService } from './system-details.service';
import {
  Criticality,
  SystemDetail,
  SystemDetailRequest,
  SystemStatus,
} from './models/system-detail.model';

type SystemRow = SystemDetail & { _rowId: string };

type SystemForm = {
  componentId: number | null;
  businessObjective: string;
  ownerArea: string;
  criticality: Criticality | '';
  systemStatus: SystemStatus;
  goLiveDate: string;
  endOfLifeDate: string;
};

@Component({
  selector: 'app-sistemas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sistemas.component.html',
  styleUrl: './sistemas.component.css',
})
export class SistemasComponent implements OnInit {
  private readonly systemDetailsService = inject(SystemDetailsService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly criticalityOptions: { value: Criticality; label: string }[] = [
    { value: 'LOW', label: 'BAJA' },
    { value: 'MEDIUM', label: 'MEDIA' },
    { value: 'HIGH', label: 'ALTA' },
    { value: 'CRITICAL', label: 'CRÍTICA' },
  ];

  readonly systemStatusOptions: { value: SystemStatus; label: string }[] = [
    { value: 'PLANNED', label: 'PLANIFICADO' },
    { value: 'ACTIVE', label: 'ACTIVO' },
    { value: 'DEPRECATED', label: 'DEPRECADO' },
    { value: 'RETIRED', label: 'RETIRADO' },
  ];

  private readonly criticalityLabels = Object.fromEntries(
    this.criticalityOptions.map((option) => [option.value, option.label]),
  ) as Record<Criticality, string>;

  private readonly systemStatusLabels = Object.fromEntries(
    this.systemStatusOptions.map((option) => [option.value, option.label]),
  ) as Record<SystemStatus, string>;

  readonly rows = signal<SystemRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: SystemForm = this.emptyForm();

  readonly availableSystemComponents = computed(() => {
    const usedIds = new Set(
      this.rows()
        .map((row) => Number(row.componentId))
        .filter((id) => Number.isFinite(id)),
    );
    return this.components().filter((component) => {
      const type = String(component.componentType ?? '').trim().toUpperCase();
      const active = String(component.isActive ?? '').trim().toUpperCase();
      const id = Number(component.componentId);
      return type === 'SYSTEM' && active === 'Y' && Number.isFinite(id) && !usedIds.has(id);
    });
  });

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        row.businessObjective,
        row.ownerArea,
        this.labelForCriticality(row.criticality),
        this.labelForSystemStatus(row.systemStatus),
        row.goLiveDate,
        row.endOfLifeDate,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadSystemDetails();
    this.loadSystemComponents();
  }

  get canSubmit(): boolean {
    return this.form.componentId != null && !!this.form.systemStatus;
  }

  labelForCriticality(value: string | null | undefined): string {
    if (!value) return '—';
    return this.criticalityLabels[value as Criticality] ?? value;
  }

  labelForSystemStatus(value: string | null | undefined): string {
    if (!value) return '—';
    return this.systemStatusLabels[value as SystemStatus] ?? value;
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || '—';
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadSystemComponents();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const componentId = this.form.componentId;
    if (componentId == null || !this.form.systemStatus) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    const ownerArea = this.form.ownerArea.trim();
    if (ownerArea.length > 200) {
      this.formError.set('El área propietaria no puede superar 200 caracteres.');
      return;
    }

    const goLiveDate = this.form.goLiveDate.trim();
    const endOfLifeDate = this.form.endOfLifeDate.trim();
    if (goLiveDate && endOfLifeDate && endOfLifeDate < goLiveDate) {
      this.formError.set('La fecha de fin de vida no puede ser anterior a la puesta en producción.');
      return;
    }

    const body: SystemDetailRequest = {
      componentId,
      systemStatus: this.form.systemStatus,
    };

    const businessObjective = this.form.businessObjective.trim();
    if (businessObjective) body.businessObjective = businessObjective;
    if (ownerArea) body.ownerArea = ownerArea;
    if (this.form.criticality) body.criticality = this.form.criticality;
    body.goLiveDate = goLiveDate || null;
    body.endOfLifeDate = endOfLifeDate || null;

    this.saving.set(true);
    this.formError.set('');

    this.systemDetailsService.createSystemDetail(body).subscribe({
      next: () => {
        this.toastService.success('Detalle de sistema creado correctamente');
        this.closeModal();
        this.loadSystemDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadSystemDetails(): void {
    this.loading.set(true);
    this.systemDetailsService.getAllSystemDetails().subscribe({
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

  private loadSystemComponents(): void {
    this.componentsService.getComponents().subscribe({
      next: (components) => {
        this.components.set(Array.isArray(components) ? components : []);
      },
      error: () => {
        this.components.set([]);
      },
    });
  }

  private toRow(detail: SystemDetail): SystemRow {
    return {
      ...detail,
      _rowId: `api-${detail.componentId}`,
    };
  }

  private emptyForm(): SystemForm {
    return {
      componentId: null,
      businessObjective: '',
      ownerArea: '',
      criticality: '',
      systemStatus: 'ACTIVE',
      goLiveDate: '',
      endOfLifeDate: '',
    };
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
      return 'Conflicto: el componente ya tiene detalle o no es de tipo SISTEMA.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    return action === 'list'
      ? 'No fue posible cargar los detalles de sistema.'
      : 'No fue posible crear el detalle de sistema.';
  }
}
