import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import { CatalogComponent } from '../../../catalogo-principal/components/componentes/models/component.model';
import { PeopleService } from '../personas/people.service';
import { Person } from '../personas/models/person.model';
import { ResponsibilityRolesService } from '../roles-de-responsabilidad/responsibility-roles.service';
import { ResponsibilityRole } from '../roles-de-responsabilidad/models/responsibility-role.model';
import { SystemResponsibilitiesService } from './system-responsibilities.service';
import { SystemResponsibility } from './models/system-responsibility.model';

type SystemResponsibilityRow = SystemResponsibility & { _rowId: string };

type SystemResponsibilityForm = {
  componentId: number | null;
  personId: number | null;
  roleId: number | null;
  notes: string;
};

@Component({
  selector: 'app-responsables-de-sistemas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './responsables-de-sistemas.component.html',
  styleUrl: './responsables-de-sistemas.component.css',
})
export class ResponsablesDeSistemasComponent implements OnInit {
  private readonly systemResponsibilitiesService = inject(SystemResponsibilitiesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly peopleService = inject(PeopleService);
  private readonly rolesService = inject(ResponsibilityRolesService);
  private readonly toastService = inject(ToastService);

  readonly rows = signal<SystemResponsibilityRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly people = signal<Person[]>([]);
  readonly roles = signal<ResponsibilityRole[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly selectedComponentId = signal<number | null>(null);
  readonly selectedPersonId = signal<number | null>(null);
  form: SystemResponsibilityForm = this.emptyForm();

  readonly systemComponents = computed(() =>
    this.components().filter((component) => {
      const type = String(component.componentType ?? '').trim().toUpperCase();
      const id = Number(component.componentId);
      return type === 'SYSTEM' && Number.isFinite(id);
    }),
  );

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        this.personName(row.personId),
        this.roleName(row.roleId),
        row.notes,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  readonly availableRoles = computed(() => {
    const componentId = this.selectedComponentId();
    const personId = this.selectedPersonId();
    if (componentId == null || personId == null) return this.roles();

    const usedRoleIds = new Set(
      this.rows()
        .filter(
          (row) =>
            Number(row.componentId) === Number(componentId) &&
            Number(row.personId) === Number(personId),
        )
        .map((row) => Number(row.roleId)),
    );

    return this.roles().filter((role) => {
      const id = Number(role.roleId);
      return Number.isFinite(id) && !usedRoleIds.has(id);
    });
  });

  ngOnInit(): void {
    this.loadSystemResponsibilities();
    this.loadComponents();
    this.loadPeople();
    this.loadRoles();
  }

  get canSubmit(): boolean {
    return (
      this.form.componentId != null &&
      this.form.personId != null &&
      this.form.roleId != null
    );
  }

  onComponentIdChange(value: number | string | null): void {
    this.form.componentId = this.toId(value);
    this.selectedComponentId.set(this.form.componentId);
    this.form.roleId = null;
  }

  onPersonIdChange(value: number | string | null): void {
    this.form.personId = this.toId(value);
    this.selectedPersonId.set(this.form.personId);
    this.form.roleId = null;
  }

  onRoleIdChange(value: number | string | null): void {
    this.form.roleId = this.toId(value);
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || String(componentId);
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

  roleName(roleId: number | null | undefined): string {
    if (roleId == null) return '—';
    const match = this.roles().find((role) => Number(role.roleId) === Number(roleId));
    return match?.roleName?.trim() || String(roleId);
  }

  roleOptionLabel(role: ResponsibilityRole): string {
    const name = role.roleName?.trim() || String(role.roleId ?? '—');
    const code = role.roleCode?.trim();
    return code ? `${name} (${code})` : name;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.selectedComponentId.set(null);
    this.selectedPersonId.set(null);
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
    this.loadPeople();
    this.loadRoles();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedComponentId.set(null);
    this.selectedPersonId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const componentId = this.toId(this.form.componentId);
    const personId = this.toId(this.form.personId);
    const roleId = this.toId(this.form.roleId);
    const notes = this.form.notes.trim();

    if (componentId == null || personId == null || roleId == null) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    const body: SystemResponsibility = { componentId, personId, roleId };
    if (notes) body.notes = notes;

    this.saving.set(true);
    this.formError.set('');

    this.systemResponsibilitiesService.createSystemResponsibility(body).subscribe({
      next: () => {
        this.toastService.success('Responsabilidad de sistema creada correctamente');
        this.closeModal();
        this.loadSystemResponsibilities();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadSystemResponsibilities(): void {
    this.loading.set(true);
    this.systemResponsibilitiesService.getAllSystemResponsibilities().subscribe({
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

  private loadRoles(): void {
    this.rolesService.getAllResponsibilityRoles().subscribe({
      next: (roles) => {
        this.roles.set(Array.isArray(roles) ? roles : []);
      },
      error: () => {
        this.roles.set([]);
      },
    });
  }

  private toRow(item: SystemResponsibility): SystemResponsibilityRow {
    return {
      ...item,
      _rowId: `resp-${item.componentId}-${item.personId}-${item.roleId}`,
    };
  }

  private emptyForm(): SystemResponsibilityForm {
    return {
      componentId: null,
      personId: null,
      roleId: null,
      notes: '',
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
      return 'Conflicto: la asignación ya existe o sistema/persona/rol no es válido.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    return action === 'list'
      ? 'No fue posible cargar las responsabilidades de sistema.'
      : 'No fue posible crear la responsabilidad de sistema.';
  }
}
