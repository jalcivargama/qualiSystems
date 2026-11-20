import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../componentes/components.service';
import { CatalogComponent } from '../componentes/models/component.model';
import { DatabaseDetailsService } from './database-details.service';
import { DatabaseDetail } from './models/database-detail.model';

type DatabaseRow = DatabaseDetail & { _rowId: string };

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

  private toRow(detail: DatabaseDetail): DatabaseRow {
    return {
      ...detail,
      _rowId: `db-${detail.componentId}`,
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
    return 'No fue posible cargar los detalles de base de datos.';
  }
}
