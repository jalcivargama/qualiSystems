import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { TechnologiesService } from './technologies.service';
import { Technology, TechnologyCategory } from './models/technology.model';

type TechnologyRow = Technology & { _rowId: string };

@Component({
  selector: 'app-tecnologias',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tecnologias.component.html',
  styleUrl: './tecnologias.component.css',
})
export class TecnologiasComponent implements OnInit {
  private readonly technologiesService = inject(TechnologiesService);
  private readonly toastService = inject(ToastService);

  readonly categoryOptions: { value: TechnologyCategory; label: string }[] = [
    { value: 'LANGUAGE', label: 'LENGUAJE' },
    { value: 'FRAMEWORK', label: 'FRAMEWORK' },
    { value: 'DATABASE', label: 'BASE DE DATOS' },
    { value: 'FRONTEND', label: 'FRONTEND' },
    { value: 'BACKEND', label: 'BACKEND' },
    { value: 'MESSAGING', label: 'MENSAJERÍA' },
    { value: 'CONTAINER', label: 'CONTENEDOR' },
    { value: 'ORCHESTRATION', label: 'ORQUESTACIÓN' },
    { value: 'MONITORING', label: 'MONITOREO' },
    { value: 'OTHER', label: 'OTRO' },
  ];

  private readonly categoryLabels = Object.fromEntries(
    this.categoryOptions.map((option) => [option.value, option.label]),
  ) as Record<TechnologyCategory, string>;

  readonly rows = signal<TechnologyRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.technologyId, this.labelForCategory(row.category), row.name].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(query),
      ),
    );
  });

  ngOnInit(): void {
    this.loadTechnologies();
  }

  labelForCategory(value: string | null | undefined): string {
    if (!value) return '—';
    return this.categoryLabels[value as TechnologyCategory] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadTechnologies(): void {
    this.loading.set(true);
    this.technologiesService.getAllTechnologies().subscribe({
      next: (technologies) => {
        this.rows.set(technologies.map((technology) => this.toRow(technology)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private toRow(technology: Technology): TechnologyRow {
    return {
      ...technology,
      _rowId: `tech-${technology.technologyId ?? technology.name}`,
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
    return 'No fue posible cargar las tecnologías.';
  }
}
