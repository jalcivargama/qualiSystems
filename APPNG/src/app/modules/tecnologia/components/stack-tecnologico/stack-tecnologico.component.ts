import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { ComponentsService } from '../../../catalogo-principal/components/componentes/components.service';
import { CatalogComponent } from '../../../catalogo-principal/components/componentes/models/component.model';
import { TechnologiesService } from '../tecnologias/technologies.service';
import { Technology } from '../tecnologias/models/technology.model';
import { ComponentTechnologiesService } from './component-technologies.service';
import { ActiveFlag, ComponentTechnology } from './models/component-technology.model';

type ComponentTechnologyRow = ComponentTechnology & { _rowId: string };

@Component({
  selector: 'app-stack-tecnologico',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stack-tecnologico.component.html',
  styleUrl: './stack-tecnologico.component.css',
})
export class StackTecnologicoComponent implements OnInit {
  private readonly componentTechnologiesService = inject(ComponentTechnologiesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly technologiesService = inject(TechnologiesService);
  private readonly toastService = inject(ToastService);

  private readonly primaryLabels: Record<ActiveFlag, string> = {
    Y: 'SÍ',
    N: 'NO',
  };

  readonly rows = signal<ComponentTechnologyRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        this.technologyName(row.technologyId),
        row.version,
        this.labelForPrimary(row.isPrimary),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadComponentTechnologies();
    this.loadComponents();
    this.loadTechnologies();
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || String(componentId);
  }

  technologyName(technologyId: number | null | undefined): string {
    if (technologyId == null) return '—';
    const match = this.technologies().find(
      (technology) => Number(technology.technologyId) === Number(technologyId),
    );
    return match?.name?.trim() || String(technologyId);
  }

  labelForPrimary(value: string | null | undefined): string {
    if (!value) return '—';
    return this.primaryLabels[value as ActiveFlag] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadComponentTechnologies(): void {
    this.loading.set(true);
    this.componentTechnologiesService.getAllComponentTechnologies().subscribe({
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

  private loadTechnologies(): void {
    this.technologiesService.getAllTechnologies().subscribe({
      next: (technologies) => {
        this.technologies.set(Array.isArray(technologies) ? technologies : []);
      },
      error: () => {
        this.technologies.set([]);
      },
    });
  }

  private toRow(item: ComponentTechnology): ComponentTechnologyRow {
    return {
      ...item,
      _rowId: `stack-${item.componentId}-${item.technologyId}`,
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
    return 'No fue posible cargar el stack tecnológico.';
  }
}
