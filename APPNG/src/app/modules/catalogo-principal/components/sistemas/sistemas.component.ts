import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { SystemDetailsService } from './system-details.service';
import {
  Criticality,
  SystemDetail,
  SystemStatus,
} from './models/system-detail.model';

type SystemRow = SystemDetail & { _rowId: string };

@Component({
  selector: 'app-sistemas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sistemas.component.html',
  styleUrl: './sistemas.component.css',
})
export class SistemasComponent implements OnInit {
  private readonly systemDetailsService = inject(SystemDetailsService);
  private readonly toastService = inject(ToastService);

  private readonly criticalityLabels: Record<Criticality, string> = {
    LOW: 'BAJA',
    MEDIUM: 'MEDIA',
    HIGH: 'ALTA',
    CRITICAL: 'CRÍTICA',
  };

  private readonly systemStatusLabels: Record<SystemStatus, string> = {
    PLANNED: 'PLANIFICADO',
    ACTIVE: 'ACTIVO',
    DEPRECATED: 'DEPRECADO',
    RETIRED: 'RETIRADO',
  };

  readonly rows = signal<SystemRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.componentId,
        row.businessObjective,
        row.ownerArea,
        this.labelForCriticality(row.criticality),
        this.labelForSystemStatus(row.systemStatus),
        row.goLiveDate,
        row.endOfLifeDate,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadSystemDetails();
  }

  labelForCriticality(value: string | null | undefined): string {
    if (!value) return '—';
    return this.criticalityLabels[value as Criticality] ?? value;
  }

  labelForSystemStatus(value: string | null | undefined): string {
    if (!value) return '—';
    return this.systemStatusLabels[value as SystemStatus] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadSystemDetails(): void {
    this.loading.set(true);
    this.systemDetailsService.getAllSystemDetails().subscribe({
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

  private toRow(detail: SystemDetail): SystemRow {
    return {
      ...detail,
      _rowId: `api-${detail.componentId}`,
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
    return 'No fue posible cargar los detalles de sistema.';
  }
}
