import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ResponsibilityRolesService } from './responsibility-roles.service';
import {
  ResponsibilityRole,
  ResponsibilityRoleRequest,
} from './models/responsibility-role.model';

type RoleRow = ResponsibilityRole & { _rowId: string };

type RoleForm = {
  roleCode: string;
  roleName: string;
};

@Component({
  selector: 'app-roles-de-responsabilidad',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './roles-de-responsabilidad.component.html',
  styleUrl: './roles-de-responsabilidad.component.css',
})
export class RolesDeResponsabilidadComponent implements OnInit {
  private readonly rolesService = inject(ResponsibilityRolesService);
  private readonly toastService = inject(ToastService);

  readonly rows = signal<RoleRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingRoleId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: RoleForm = this.emptyForm();

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.roleCode, row.roleName].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(query),
      ),
    );
  });

  ngOnInit(): void {
    this.loadRoles();
  }

  get canSubmit(): boolean {
    return this.form.roleCode.trim().length > 0 && this.form.roleName.trim().length > 0;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingRoleId.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(row: RoleRow): void {
    this.isEditing.set(true);
    this.editingRoleId.set(row.roleId ?? null);
    this.form = {
      roleCode: row.roleCode ?? '',
      roleName: row.roleName ?? '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingRoleId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const roleCode = this.form.roleCode.trim();
    const roleName = this.form.roleName.trim();

    if (!roleCode || !roleName) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (roleCode.length > 40) {
      this.formError.set('El código no puede superar 40 caracteres.');
      return;
    }

    if (roleName.length > 100) {
      this.formError.set('El nombre no puede superar 100 caracteres.');
      return;
    }

    const body: ResponsibilityRoleRequest = { roleCode, roleName };

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const id = this.editingRoleId();
      if (id == null) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar el rol a actualizar.');
        return;
      }

      this.rolesService.updateResponsibilityRole(id, body).subscribe({
        next: () => {
          this.toastService.success('Rol actualizado correctamente');
          this.closeModal();
          this.loadRoles();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    this.rolesService.createResponsibilityRole(body).subscribe({
      next: () => {
        this.toastService.success('Rol creado correctamente');
        this.closeModal();
        this.loadRoles();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadRoles(): void {
    this.loading.set(true);
    this.rolesService.getAllResponsibilityRoles().subscribe({
      next: (roles) => {
        this.rows.set(roles.map((role) => this.toRow(role)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private toRow(role: ResponsibilityRole): RoleRow {
    return {
      ...role,
      _rowId: `api-${role.roleId ?? role.roleCode}`,
    };
  }

  private emptyForm(): RoleForm {
    return {
      roleCode: '',
      roleName: '',
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
    if (error.status === 404) return 'El rol no existe o ya fue eliminado.';
    if (error.status === 409) return 'Ya existe un rol con ese código o nombre.';
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los roles de responsabilidad.';
    if (action === 'update') return 'No fue posible actualizar el rol.';
    return 'No fue posible crear el rol.';
  }
}
