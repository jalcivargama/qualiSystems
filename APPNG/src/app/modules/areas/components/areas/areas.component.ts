import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import {
  transformInputToUpperCase,
  transformPasteToUpperCase,
} from '../../../../shared/functions/input.functions';
import { PeopleService } from '../../../personas-y-roles/components/personas/people.service';
import { Person } from '../../../personas-y-roles/components/personas/models/person.model';
import { AreasService } from './areas.service';
import { CatalogArea } from './models/catalog-area.model';

type AreaRow = CatalogArea & { _rowId: string };

type AreaForm = {
  areaName: string;
  description: string;
  acronym: string;
  contactPersonId: number | null;
};

@Component({
  selector: 'app-areas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.css',
})
export class AreasComponent implements OnInit {
  private readonly areasService = inject(AreasService);
  private readonly peopleService = inject(PeopleService);
  private readonly toastService = inject(ToastService);

  readonly rows = signal<AreaRow[]>([]);
  readonly people = signal<Person[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingAreaName = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formError = signal('');
  readonly transformToUpperCase = transformInputToUpperCase;
  readonly transformPasteToUpper = transformPasteToUpperCase;
  form: AreaForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.areaName,
        row.description,
        row.acronym,
        this.personName(row.contactPersonId),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadAreas();
    this.loadPeople();
  }

  get canSubmit(): boolean {
    return this.form.areaName.trim().length > 0;
  }

  personName(personId: number | null | undefined): string {
    if (personId == null) return '—';
    const match = this.people().find((person) => Number(person.personId) === Number(personId));
    return match?.fullName?.trim() || String(personId);
  }

  personOptionLabel(person: Person): string {
    const name = person.fullName?.trim() || String(person.personId ?? '—');
    const email = person.email?.trim();
    return email ? `${name} (${email})` : name;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingAreaName.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadPeople();
  }

  openEdit(row: AreaRow): void {
    this.isEditing.set(true);
    this.editingAreaName.set(row.areaName ?? null);
    this.form = {
      areaName: row.areaName ?? '',
      description: row.description ?? '',
      acronym: (row.acronym ?? '').toUpperCase(),
      contactPersonId: this.toId(row.contactPersonId),
    };
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadPeople();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingAreaName.set(null);
    this.formError.set('');
    this.saving.set(false);
    this.deleting.set(false);
  }

  onContactPersonIdChange(value: number | string | null): void {
    this.form.contactPersonId = this.toId(value);
  }

  deleteCurrent(): void {
    if (!this.isEditing() || this.saving() || this.deleting()) return;

    const areaName = this.editingAreaName()?.trim();
    if (!areaName) {
      this.toastService.error('No se pudo identificar el área a eliminar.');
      return;
    }

    if (!window.confirm(`¿Eliminar el área "${areaName}"?`)) {
      return;
    }

    this.deleting.set(true);
    this.formError.set('');

    this.areasService.deleteArea(areaName).subscribe({
      next: () => {
        this.toastService.success('Área eliminada correctamente');
        this.closeModal();
        this.loadAreas();
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'delete'));
      },
    });
  }

  save(): void {
    if (this.saving() || this.deleting() || !this.canSubmit) return;

    const areaName = this.form.areaName.trim();
    const description = this.form.description.trim();
    const acronym = this.form.acronym.trim().toUpperCase();
    this.form.acronym = acronym;
    const contactPersonId = this.toId(this.form.contactPersonId);

    if (!areaName) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (areaName.length > 30) {
      this.formError.set('El nombre del área no puede superar 30 caracteres.');
      return;
    }

    if (description.length > 200) {
      this.formError.set('La descripción no puede superar 200 caracteres.');
      return;
    }

    if (acronym.length > 50) {
      this.formError.set('El acrónimo no puede superar 50 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const editingName = this.editingAreaName()?.trim();
      if (!editingName) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar el área a actualizar.');
        return;
      }

      const updateBody: CatalogArea = {
        areaName: editingName,
        description: description || null,
        acronym: acronym || null,
        contactPersonId,
      };

      this.areasService.updateArea(editingName, updateBody).subscribe({
        next: () => {
          this.toastService.success('Área actualizada correctamente');
          this.closeModal();
          this.loadAreas();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: CatalogArea = { areaName };
    if (description) createBody.description = description;
    if (acronym) createBody.acronym = acronym;
    if (contactPersonId != null) createBody.contactPersonId = contactPersonId;

    this.areasService.createArea(createBody).subscribe({
      next: () => {
        this.toastService.success('Área creada correctamente');
        this.closeModal();
        this.loadAreas();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadAreas(): void {
    this.loading.set(true);
    this.areasService.getAllAreas().subscribe({
      next: (areas) => {
        this.rows.set(areas.map((area) => this.toRow(area)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private loadPeople(): void {
    this.peopleService.getPeople().subscribe({
      next: (people) => {
        this.people.set(Array.isArray(people) ? people : []);
      },
      error: () => {
        this.people.set([]);
      },
    });
  }

  private toRow(area: CatalogArea): AreaRow {
    return {
      ...area,
      _rowId: `area-${area.areaName}`,
    };
  }

  private emptyForm(): AreaForm {
    return {
      areaName: '',
      description: '',
      acronym: '',
      contactPersonId: null,
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
    if (error.status === 404) return 'El área no existe o ya fue eliminada.';
    if (error.status === 409) {
      return action === 'delete'
        ? 'No se puede eliminar: el área tiene registros relacionados.'
        : 'Conflicto: el nombre del área ya existe o la persona de contacto no es válida.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar las áreas.';
    if (action === 'update') return 'No fue posible actualizar el área.';
    if (action === 'delete') return 'No fue posible eliminar el área.';
    return 'No fue posible crear el área.';
  }
}
