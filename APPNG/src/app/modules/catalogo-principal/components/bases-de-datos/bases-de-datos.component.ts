import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../componentes/components.service';
import { CatalogComponent } from '../componentes/models/component.model';
import { DatabaseDetailsService } from './database-details.service';
import {
  DatabaseDetail,
  DatabaseDetailRequest,
  DatabaseDetailUpdateRequest,
} from './models/database-detail.model';

type DatabaseRow = DatabaseDetail & { _rowId: string };

type DatabaseForm = {
  componentId: number | null;
  engine: string;
  engineVersion: string;
  instanceName: string;
  schemaName: string;
};

@Component({
  selector: 'app-bases-de-datos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bases-de-datos.component.html',
  styleUrl: './bases-de-datos.component.css',
})
export class BasesDeDatosComponent implements OnInit {
  private readonly databaseDetailsService = inject(DatabaseDetailsService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly rows = signal<DatabaseRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingComponentId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: DatabaseForm = this.emptyForm();

  readonly availableDatabaseComponents = computed(() => {
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
      return type === 'DATABASE' && active === 'Y' && Number.isFinite(id) && !usedIds.has(id);
    });
  });

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        row.engine,
        row.engineVersion,
        row.instanceName,
        row.schemaName,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDatabaseDetails();
    this.loadComponents();
  }

  get canSubmit(): boolean {
    const componentId = this.resolveComponentId() ?? this.editingComponentId();
    return componentId != null && !!this.form.engine.trim();
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

  openEdit(row: DatabaseRow): void {
    const componentId = this.toComponentId(row.componentId);
    this.isEditing.set(true);
    this.editingComponentId.set(componentId);
    this.form = {
      componentId,
      engine: row.engine ?? '',
      engineVersion: row.engineVersion ?? '',
      instanceName: row.instanceName ?? '',
      schemaName: row.schemaName ?? '',
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
      this.formError.set('Selecciona un componente BASE DE DATOS.');
      return;
    }

    const engine = this.form.engine.trim();
    const engineVersion = this.form.engineVersion.trim();
    const instanceName = this.form.instanceName.trim();
    const schemaName = this.form.schemaName.trim();

    if (!engine) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }
    if (engine.length > 100) {
      this.formError.set('El motor no puede superar 100 caracteres.');
      return;
    }
    if (engineVersion.length > 100) {
      this.formError.set('La versión no puede superar 100 caracteres.');
      return;
    }
    if (instanceName.length > 200) {
      this.formError.set('La instancia no puede superar 200 caracteres.');
      return;
    }
    if (schemaName.length > 200) {
      this.formError.set('El esquema no puede superar 200 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    this.form.componentId = componentId;

    if (this.isEditing()) {
      const updateBody: DatabaseDetailUpdateRequest = {
        componentId,
        engine,
        engineVersion: engineVersion || null,
        instanceName: instanceName || null,
        schemaName: schemaName || null,
      };

      this.databaseDetailsService.updateDatabaseDetail(componentId, updateBody).subscribe({
        next: () => {
          this.toastService.success('Detalle de base de datos actualizado correctamente');
          this.closeModal();
          this.loadDatabaseDetails();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: DatabaseDetailRequest = { componentId, engine };
    if (engineVersion) createBody.engineVersion = engineVersion;
    if (instanceName) createBody.instanceName = instanceName;
    if (schemaName) createBody.schemaName = schemaName;

    this.databaseDetailsService.createDatabaseDetail(createBody).subscribe({
      next: () => {
        this.toastService.success('Detalle de base de datos creado correctamente');
        this.closeModal();
        this.loadDatabaseDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadDatabaseDetails(): void {
    this.loading.set(true);
    this.databaseDetailsService.getAllDatabaseDetails().subscribe({
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

  private toRow(detail: DatabaseDetail): DatabaseRow {
    return {
      ...detail,
      _rowId: `db-${detail.componentId}`,
    };
  }

  private emptyForm(): DatabaseForm {
    return {
      componentId: null,
      engine: '',
      engineVersion: '',
      instanceName: '',
      schemaName: '',
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
    if (error.status === 404) return 'El detalle de base de datos no existe o ya fue eliminado.';
    if (error.status === 409) {
      return action === 'update'
        ? 'No se puede actualizar por restricciones relacionadas.'
        : 'Conflicto: el componente ya tiene detalle o no es de tipo BASE DE DATOS.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los detalles de base de datos.';
    if (action === 'update') return 'No fue posible actualizar el detalle de base de datos.';
    return 'No fue posible crear el detalle de base de datos.';
  }
}
