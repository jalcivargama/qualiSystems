import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import { CatalogComponent } from '../../../catalogo-principal/components/componentes/models/component.model';
import { SystemDeploymentsService } from './system-deployments.service';
import { Environment, SystemDeployment } from './models/system-deployment.model';

type DeploymentRow = SystemDeployment & { _rowId: string };

@Component({
  selector: 'app-despliegues',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './despliegues.component.html',
  styleUrl: './despliegues.component.css',
})
export class DesplieguesComponent implements OnInit {
  private readonly systemDeploymentsService = inject(SystemDeploymentsService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly environmentOptions: { value: Environment; label: string }[] = [
    { value: 'DEVELOPMENT', label: 'DESARROLLO' },
    { value: 'TEST', label: 'PRUEBAS' },
    { value: 'QA', label: 'QA' },
    { value: 'STAGING', label: 'STAGING' },
    { value: 'PRODUCTION', label: 'PRODUCCIÓN' },
    { value: 'DR', label: 'DR' },
  ];

  private readonly environmentLabels = Object.fromEntries(
    this.environmentOptions.map((option) => [option.value, option.label]),
  ) as Record<Environment, string>;

  readonly rows = signal<DeploymentRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.deploymentId,
        this.componentName(row.componentId),
        this.labelForEnvironment(row.environment),
        row.url,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDeployments();
    this.loadComponents();
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || '—';
  }

  labelForEnvironment(value: string | null | undefined): string {
    if (!value) return '—';
    return this.environmentLabels[value as Environment] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadDeployments(): void {
    this.loading.set(true);
    this.systemDeploymentsService.getAllSystemDeployments().subscribe({
      next: (deployments) => {
        this.rows.set(deployments.map((deployment) => this.toRow(deployment)));
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

  private toRow(deployment: SystemDeployment): DeploymentRow {
    return {
      ...deployment,
      _rowId: `dep-${deployment.deploymentId ?? `${deployment.componentId}-${deployment.environment}`}`,
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
    return 'No fue posible cargar los despliegues.';
  }
}
