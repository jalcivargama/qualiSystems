import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { DependenciesService } from './dependencies.service';
import {
  Criticality,
  Dependency,
  DependencyScope,
} from './models/dependency.model';

type DependencyRow = Dependency & { _rowId: string };

@Component({
  selector: 'app-dependencias',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dependencias.component.html',
  styleUrl: './dependencias.component.css',
})
export class DependenciasComponent implements OnInit {
  private readonly dependenciesService = inject(DependenciesService);
  private readonly toastService = inject(ToastService);

  private readonly scopeLabels: Record<DependencyScope, string> = {
    INTERNAL: 'INTERNA',
    EXTERNAL: 'EXTERNA',
  };

  private readonly criticalityLabels: Record<Criticality, string> = {
    LOW: 'BAJA',
    MEDIUM: 'MEDIA',
    HIGH: 'ALTA',
    CRITICAL: 'CRÍTICA',
  };

  readonly rows = signal<DependencyRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.dependencyId,
        row.originComponentId,
        row.targetComponentId,
        row.dependencyTypeId,
        this.labelForScope(row.dependencyScope),
        this.labelForCriticality(row.criticality),
        row.description,
        row.createdAt,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDependencies();
  }

  labelForScope(value: string | null | undefined): string {
    if (!value) return '—';
    return this.scopeLabels[value as DependencyScope] ?? value;
  }

  labelForCriticality(value: string | null | undefined): string {
    if (!value) return '—';
    return this.criticalityLabels[value as Criticality] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadDependencies(): void {
    this.loading.set(true);
    this.dependenciesService.getAllDependencies().subscribe({
      next: (dependencies) => {
        this.rows.set(dependencies.map((dependency) => this.toRow(dependency)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private toRow(dependency: Dependency): DependencyRow {
    return {
      ...dependency,
      _rowId: `dep-${dependency.dependencyId ?? `${dependency.originComponentId}-${dependency.targetComponentId}`}`,
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
    return 'No fue posible cargar las dependencias.';
  }
}
