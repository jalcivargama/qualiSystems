import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ResponsibilityRolesService } from './responsibility-roles.service';
import { ResponsibilityRole } from './models/responsibility-role.model';

type RoleRow = ResponsibilityRole & { _rowId: string };

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

  clearSearch(): void {
    this.searchTerm.set('');
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
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private toRow(role: ResponsibilityRole): RoleRow {
    return {
      ...role,
      _rowId: `api-${role.roleId ?? role.roleCode}`,
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
    return 'No fue posible cargar los roles de responsabilidad.';
  }
}
