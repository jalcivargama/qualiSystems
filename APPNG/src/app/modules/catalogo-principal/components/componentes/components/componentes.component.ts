import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../../core/toast.service';
import { TIPOS_RECURSOS_OPTIONS } from '../../../../../shared/enum/tipos.recuros.enum';
import { ComponentsService } from '../components.service';
import {
  ActiveFlag,
  CatalogComponent,
  ComponentRequest,
  ComponentType,
} from '../models/component.model';
import { NuevoSistemaModalComponent } from '../nuevo-sistema-modal/nuevo-sistema-modal.component';
import { NuevoSistemaForm } from '../nuevo-sistema-modal/nuevo-sistema-modal.models';
import { NuevoComponenteModalComponent } from '../nuevo-componente-modal/nuevo-componente-modal.component';
import { NuevoComponenteForm } from '../nuevo-componente-modal/nuevo-componente-modal.models';

type ComponentRow = CatalogComponent & { _rowId: string };

type CreateForm = {
  componentType: ComponentType;
  name: string;
  acronym: string;
  resourceType: string;
  description: string;
  isActive: ActiveFlag;
};

@Component({
  selector: 'app-componentes',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NuevoSistemaModalComponent,
    NuevoComponenteModalComponent,
  ],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css',
})
export class ComponentesComponent implements OnInit {
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly componentTypeOptions: { value: ComponentType; label: string }[] = [
    { value: 'SYSTEM', label: 'SISTEMA' },
    { value: 'API', label: 'API' },
    { value: 'DATABASE', label: 'BASE DE DATOS' },
    { value: 'INFRASTRUCTURE', label: 'INFRAESTRUCTURA' },
    { value: 'EXTERNAL_SERVICE', label: 'SERVICIO EXTERNO' },
    { value: 'MESSAGING', label: 'MENSAJERÍA' },
  ];

  readonly activeFlagOptions: { value: ActiveFlag; label: string }[] = [
    { value: 'Y', label: 'SÍ' },
    { value: 'N', label: 'NO' },
  ];

  readonly resourceTypeOptions = TIPOS_RECURSOS_OPTIONS;

  private readonly componentTypeLabels = Object.fromEntries(
    this.componentTypeOptions.map((option) => [option.value, option.label]),
  ) as Record<ComponentType, string>;

  private readonly activeFlagLabels = Object.fromEntries(
    this.activeFlagOptions.map((option) => [option.value, option.label]),
  ) as Record<ActiveFlag, string>;

  readonly rows = signal<ComponentRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedType = signal<ComponentType | ''>('');
  readonly modalOpen = signal(false);
  readonly nuevoSistemaModalOpen = signal(false);
  readonly nuevoComponenteModalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingComponentId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formError = signal('');
  form: CreateForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const type = this.selectedType();
    let rows = this.rows();

    if (type) {
      rows = rows.filter(
        (row) => String(row.componentType ?? '').trim().toUpperCase() === type,
      );
    }

    if (!query) return rows;

    return rows.filter((row) =>
      [
        this.labelForComponentType(row.componentType),
        row.name,
        row.acronym,
        row.description,
        this.labelForActiveFlag(row.isActive),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadComponents();
  }

  labelForComponentType(value: string | null | undefined): string {
    if (!value) return '—';
    return this.componentTypeLabels[value as ComponentType] ?? value;
  }

  labelForActiveFlag(value: string | null | undefined): string {
    if (!value) return '—';
    return this.activeFlagLabels[value as ActiveFlag] ?? value;
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingComponentId.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openNuevoSistema(): void {
    this.nuevoSistemaModalOpen.set(true);
  }

  closeNuevoSistema(): void {
    this.nuevoSistemaModalOpen.set(false);
  }

  onNuevoSistemaSaved(_payload: NuevoSistemaForm): void {
    this.nuevoSistemaModalOpen.set(false);
  }

  openNuevoComponente(): void {
    this.nuevoComponenteModalOpen.set(true);
  }

  closeNuevoComponente(): void {
    this.nuevoComponenteModalOpen.set(false);
  }

  onNuevoComponenteSaved(_payload: NuevoComponenteForm[]): void {
    this.nuevoComponenteModalOpen.set(false);
    this.loadComponents();
  }

  openEdit(row: ComponentRow): void {
    this.isEditing.set(true);
    this.editingComponentId.set(row.componentId ?? null);
    this.form = {
      componentType: row.componentType,
      name: row.name ?? '',
      acronym: row.acronym ?? '',
      resourceType: row.resourceType ?? '',
      description: row.description ?? '',
      isActive: (row.isActive === 'N' ? 'N' : 'Y') as ActiveFlag,
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
    this.deleting.set(false);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectedType.set('');
  }

  deleteCurrent(): void {
    if (!this.isEditing() || this.saving() || this.deleting()) return;

    const id = this.editingComponentId();
    if (id == null) {
      this.toastService.error('No se pudo identificar el componente a eliminar.');
      return;
    }

    if (!window.confirm(`¿Eliminar el componente "${this.form.name.trim() || id}"?`)) {
      return;
    }

    this.deleting.set(true);
    this.formError.set('');

    this.componentsService.deleteComponent(id).subscribe({
      next: () => {
        this.toastService.success('Componente eliminado correctamente');
        this.closeModal();
        this.loadComponents();
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'delete'));
      },
    });
  }

  save(): void {
    if (this.saving() || this.deleting()) return;

    const name = this.form.name.trim();
    if (!this.form.componentType || !name || !this.form.isActive) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (name.length > 200) {
      this.formError.set('El nombre no puede superar 200 caracteres.');
      return;
    }

    const acronym = this.form.acronym.trim();
    if (acronym.length > 50) {
      this.formError.set('El acrónimo no puede superar 50 caracteres.');
      return;
    }

    const resourceType = this.form.resourceType.trim();
    const description = this.form.description.trim();
    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const id = this.editingComponentId();
      if (id == null) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar el componente a actualizar.');
        return;
      }

      const body: ComponentRequest = {
        componentType: this.form.componentType,
        name,
        acronym: acronym || null,
        resourceType: resourceType || null,
        description: description || null,
        isActive: this.form.isActive,
      };

      this.componentsService.updateComponent(id, body).subscribe({
        next: () => {
          this.toastService.success('Componente actualizado correctamente');
          this.closeModal();
          this.loadComponents();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const body: ComponentRequest = {
      componentType: this.form.componentType,
      name,
      isActive: this.form.isActive,
    };
    if (acronym) body.acronym = acronym;
    if (resourceType) body.resourceType = resourceType;
    if (description) body.description = description;

    this.componentsService.createNewComponent(body).subscribe({
      next: () => {
        this.toastService.success('Componente creado correctamente');
        this.closeModal();
        this.loadComponents();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadComponents(): void {
    this.loading.set(true);
    this.componentsService.getComponents().subscribe({
      next: (components) => {
        this.rows.set(components.map((component) => this.toRow(component)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private toRow(component: CatalogComponent): ComponentRow {
    return {
      ...component,
      _rowId: `api-${component.componentId ?? component.name}`,
    };
  }

  private emptyForm(): CreateForm {
    return {
      componentType: 'SYSTEM',
      name: '',
      acronym: '',
      resourceType: '',
      description: '',
      isActive: 'Y',
    };
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
    if (error.status === 404) return 'El componente no existe o ya fue eliminado.';
    if (error.status === 409) {
      return action === 'delete'
        ? 'No se puede eliminar: el componente tiene registros relacionados.'
        : 'Ya existe un componente con ese nombre y tipo.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los componentes.';
    if (action === 'update') return 'No fue posible actualizar el componente.';
    if (action === 'delete') return 'No fue posible eliminar el componente.';
    return 'No fue posible crear el componente.';
  }
}
