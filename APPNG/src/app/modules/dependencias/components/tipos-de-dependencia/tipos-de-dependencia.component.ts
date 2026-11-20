import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { DependencyTypesService } from './dependency-types.service';
import { DependencyType } from './models/dependency-type.model';

type DependencyTypeRow = DependencyType & { _rowId: string };

@Component({
  selector: 'app-tipos-de-dependencia',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tipos-de-dependencia.component.html',
  styleUrl: './tipos-de-dependencia.component.css',
})
export class TiposDeDependenciaComponent implements OnInit {
  private readonly dependencyTypesService = inject(DependencyTypesService);
  private readonly toastService = inject(ToastService);

  readonly rows = signal<DependencyTypeRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.dependencyTypeId, row.typeCode, row.typeName].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(query),
      ),
    );
  });

  ngOnInit(): void {
    this.loadDependencyTypes();
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadDependencyTypes(): void {
    this.loading.set(true);
    this.dependencyTypesService.getAllDependencyTypes().subscribe({
      next: (types) => {
        this.rows.set(types.map((type) => this.toRow(type)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private toRow(type: DependencyType): DependencyTypeRow {
    return {
      ...type,
      _rowId: `dep-type-${type.dependencyTypeId ?? type.typeCode}`,
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
    return 'No fue posible cargar los tipos de dependencia.';
  }
}
