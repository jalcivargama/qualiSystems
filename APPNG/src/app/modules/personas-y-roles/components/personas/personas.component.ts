import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { PeopleService } from './people.service';
import { ActiveFlag, Person, PersonRequest } from './models/person.model';

type PersonRow = Person & { _rowId: string };

type PersonForm = {
  fullName: string;
  email: string;
  organization: string;
  isActive: ActiveFlag;
};

@Component({
  selector: 'app-personas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './personas.component.html',
  styleUrl: './personas.component.css',
})
export class PersonasComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly toastService = inject(ToastService);

  readonly activeFlagOptions: { value: ActiveFlag; label: string }[] = [
    { value: 'Y', label: 'SÍ' },
    { value: 'N', label: 'NO' },
  ];

  private readonly activeFlagLabels = Object.fromEntries(
    this.activeFlagOptions.map((option) => [option.value, option.label]),
  ) as Record<ActiveFlag, string>;

  readonly rows = signal<PersonRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingPersonId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: PersonForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.fullName,
        row.email,
        row.organization,
        this.labelForActiveFlag(row.isActive),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadPeople();
  }

  labelForActiveFlag(value: string | null | undefined): string {
    if (!value) return '—';
    return this.activeFlagLabels[value as ActiveFlag] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  get canSubmit(): boolean {
    return this.form.fullName.trim().length > 0 && this.form.email.trim().length > 0;
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingPersonId.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(row: PersonRow): void {
    this.isEditing.set(true);
    this.editingPersonId.set(row.personId ?? null);
    this.form = {
      fullName: row.fullName ?? '',
      email: row.email ?? '',
      organization: row.organization ?? '',
      isActive: (row.isActive === 'N' ? 'N' : 'Y') as ActiveFlag,
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingPersonId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const fullName = this.form.fullName.trim();
    const email = this.form.email.trim();

    if (!fullName || !email || !this.form.isActive) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (fullName.length > 200) {
      this.formError.set('El nombre no puede superar 200 caracteres.');
      return;
    }

    if (email.length > 320) {
      this.formError.set('El correo no puede superar 320 caracteres.');
      return;
    }

    const organization = this.form.organization.trim();
    if (organization.length > 200) {
      this.formError.set('La organización no puede superar 200 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const id = this.editingPersonId();
      if (id == null) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar la persona a actualizar.');
        return;
      }

      const updateBody: PersonRequest = {
        fullName,
        email,
        organization: organization || null,
        isActive: this.form.isActive,
      };

      this.peopleService.updatePerson(id, updateBody).subscribe({
        next: () => {
          this.toastService.success('Persona actualizada correctamente');
          this.closeModal();
          this.loadPeople();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: PersonRequest = {
      fullName,
      email,
      isActive: this.form.isActive,
    };
    if (organization) createBody.organization = organization;

    this.peopleService.createPerson(createBody).subscribe({
      next: () => {
        this.toastService.success('Persona creada correctamente');
        this.closeModal();
        this.loadPeople();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadPeople(): void {
    this.loading.set(true);
    this.peopleService.getPeople().subscribe({
      next: (people) => {
        this.rows.set(people.map((person) => this.toRow(person)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private toRow(person: Person): PersonRow {
    return {
      ...person,
      _rowId: `api-${person.personId ?? person.fullName}`,
    };
  }

  private emptyForm(): PersonForm {
    return {
      fullName: '',
      email: '',
      organization: '',
      isActive: 'Y',
    };
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
    if (error.status === 404) return 'La persona no existe o ya fue eliminada.';
    if (error.status === 409) return 'Ya existe una persona con ese correo.';
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar las personas.';
    if (action === 'update') return 'No fue posible actualizar la persona.';
    return 'No fue posible crear la persona.';
  }
}
