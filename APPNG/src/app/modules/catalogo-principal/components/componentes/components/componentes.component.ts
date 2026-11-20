import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CatalogStoreService, MockRecord } from '../../../../../core/catalog-store.service';
import { ToastService } from '../../../../../core/toast.service';
import { ComponentsService } from '../components.service';
import {
  ActiveFlag,
  ComponentType,
  CreateNewComponentDto,
} from '../models/create.component.dto';
import { CreateComponentResponseDto } from '../models/create.component.response.dto';

type ComponentRow = CreateComponentResponseDto & { _rowId: string };

type CreateForm = {
  componentType: ComponentType;
  name: string;
  acronym: string;
  description: string;
  isActive: ActiveFlag;
};

@Component({
  selector: 'app-componentes',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css',
})
export class ComponentesComponent implements OnInit {
  private readonly store = inject(CatalogStoreService);
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

  private readonly componentTypeLabels = Object.fromEntries(
    this.componentTypeOptions.map((option) => [option.value, option.label]),
  ) as Record<ComponentType, string>;

  private readonly activeFlagLabels = Object.fromEntries(
    this.activeFlagOptions.map((option) => [option.value, option.label]),
  ) as Record<ActiveFlag, string>;

  rows: ComponentRow[] = [];
  searchTerm = '';
  modalOpen = false;
  saving = false;
  formError = '';
  form: CreateForm = this.emptyForm();

  ngOnInit(): void {
    this.rows = this.store.getRecords('catalog_component').map((row) => this.fromMock(row));
  }

  get filteredRows(): ComponentRow[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    if (!query) return this.rows;
    return this.rows.filter((row) =>
      [
        this.labelForComponentType(row.componentType),
        row.name,
        row.acronym,
        row.description,
        this.labelForActiveFlag(row.isActive),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
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
    this.form = this.emptyForm();
    this.formError = '';
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.formError = '';
    this.saving = false;
  }

  save(): void {
    if (this.saving) return;

    const name = this.form.name.trim();
    if (!this.form.componentType || !name || !this.form.isActive) {
      this.formError = 'Completa los campos obligatorios.';
      return;
    }

    if (name.length > 200) {
      this.formError = 'El nombre no puede superar 200 caracteres.';
      return;
    }

    const acronym = this.form.acronym.trim();
    if (acronym.length > 50) {
      this.formError = 'El acrónimo no puede superar 50 caracteres.';
      return;
    }

    const dto: CreateNewComponentDto = {
      componentType: this.form.componentType,
      name,
      isActive: this.form.isActive,
    };

    if (acronym) dto.acronym = acronym;
    const description = this.form.description.trim();
    if (description) dto.description = description;

    this.saving = true;
    this.formError = '';

    this.componentsService.createNewComponent(dto).subscribe({
      next: (created) => {
        this.rows = [
          {
            ...created,
            _rowId: `api-${created.componentId}`,
          },
          ...this.rows,
        ];
        this.toastService.success('Componente creado correctamente');
        this.closeModal();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private emptyForm(): CreateForm {
    return {
      componentType: 'SYSTEM',
      name: '',
      acronym: '',
      description: '',
      isActive: 'Y',
    };
  }

  private fromMock(row: MockRecord): ComponentRow {
    return {
      _rowId: row._mockId,
      componentId: Number(row['component_id'] ?? 0),
      componentType: String(row['component_type'] ?? ''),
      name: String(row['name'] ?? ''),
      acronym: row['acronym'] != null ? String(row['acronym']) : null,
      description: row['description'] != null ? String(row['description']) : null,
      isActive: String(row['is_active'] ?? 'Y'),
      createdAt: String(row['created_at'] ?? ''),
      updatedAt: String(row['updated_at'] ?? ''),
    };
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 409) return 'Ya existe un componente con ese nombre y tipo.';
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    return 'No fue posible crear el componente.';
  }
}
