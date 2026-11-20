import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { TechnologiesService } from './technologies.service';
import {
  Technology,
  TechnologyCategory,
  TechnologyRequest,
} from './models/technology.model';

type TechnologyRow = Technology & { _rowId: string };

type TechnologyForm = {
  category: TechnologyCategory | '';
  name: string;
};

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
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingTechnologyId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: TechnologyForm = this.emptyForm();

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

  get canSubmit(): boolean {
    return !!this.form.category && this.form.name.trim().length > 0;
  }

  labelForCategory(value: string | null | undefined): string {
    if (!value) return '—';
    return this.categoryLabels[value as TechnologyCategory] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingTechnologyId.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(row: TechnologyRow): void {
    this.isEditing.set(true);
    this.editingTechnologyId.set(row.technologyId ?? null);
    this.form = {
      category: row.category ?? '',
      name: row.name ?? '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingTechnologyId.set(null);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const category = this.form.category;
    const name = this.form.name.trim();

    if (!category || !name) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (name.length > 200) {
      this.formError.set('El nombre no puede superar 200 caracteres.');
      return;
    }

    const body: TechnologyRequest = { category, name };

    this.saving.set(true);
    this.formError.set('');

    if (this.isEditing()) {
      const id = this.editingTechnologyId();
      if (id == null) {
        this.saving.set(false);
        this.toastService.error('No se pudo identificar la tecnología a actualizar.');
        return;
      }

      this.technologiesService.updateTechnology(id, body).subscribe({
        next: () => {
          this.toastService.success('Tecnología actualizada correctamente');
          this.closeModal();
          this.loadTechnologies();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    this.technologiesService.createTechnology(body).subscribe({
      next: () => {
        this.toastService.success('Tecnología creada correctamente');
        this.closeModal();
        this.loadTechnologies();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
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
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private toRow(technology: Technology): TechnologyRow {
    return {
      ...technology,
      _rowId: `tech-${technology.technologyId ?? technology.name}`,
    };
  }

  private emptyForm(): TechnologyForm {
    return {
      category: '',
      name: '',
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
    if (error.status === 404) return 'La tecnología no existe o ya fue eliminada.';
    if (error.status === 409) {
      return 'Conflicto: ya existe una tecnología con esa categoría y nombre.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar las tecnologías.';
    if (action === 'update') return 'No fue posible actualizar la tecnología.';
    return 'No fue posible crear la tecnología.';
  }
}
