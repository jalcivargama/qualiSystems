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

  ngOnInit(): void {
    this.loadSystemResponsibilities();
    this.loadComponents();
    this.loadPeople();
    this.loadRoles();
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

  roleName(roleId: number | null | undefined): string {
    if (roleId == null) return '—';
    const match = this.roles().find((role) => Number(role.roleId) === Number(roleId));
    return match?.roleName?.trim() || String(roleId);
  }

  clearSearch(): void {
    this.searchTerm.set('');
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
        this.toastService.error(this.resolveErrorMessage(error));
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

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    return 'No fue posible cargar las responsabilidades de sistema.';
  }
}
