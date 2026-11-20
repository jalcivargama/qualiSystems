import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { DataFlowsService } from './data-flows.service';
import { DataFlow, Sensitivity } from './models/data-flow.model';

type DataFlowRow = DataFlow & { _rowId: string };

@Component({
  selector: 'app-flujos-de-datos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './flujos-de-datos.component.html',
  styleUrl: './flujos-de-datos.component.css',
})
export class FlujosDeDatosComponent implements OnInit {
  private readonly dataFlowsService = inject(DataFlowsService);
  private readonly toastService = inject(ToastService);

  private readonly sensitivityLabels: Record<Sensitivity, string> = {
    PUBLIC: 'PÚBLICA',
    INTERNAL: 'INTERNA',
    CONFIDENTIAL: 'CONFIDENCIAL',
    RESTRICTED: 'RESTRINGIDA',
  };

  readonly rows = signal<DataFlowRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.dataFlowId,
        row.dependencyId,
        row.dataName,
        row.periodicity,
        this.labelForSensitivity(row.sensitivity),
        row.dataFormat,
        row.description,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDataFlows();
  }

  labelForSensitivity(value: string | null | undefined): string {
    if (!value) return '—';
    return this.sensitivityLabels[value as Sensitivity] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadDataFlows(): void {
    this.loading.set(true);
    this.dataFlowsService.getAllDataFlows().subscribe({
      next: (flows) => {
        this.rows.set(flows.map((flow) => this.toRow(flow)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private toRow(flow: DataFlow): DataFlowRow {
    return {
      ...flow,
      _rowId: `data-flow-${flow.dataFlowId ?? `${flow.dependencyId}-${flow.dataName}`}`,
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
    return 'No fue posible cargar los flujos de datos.';
  }
}
