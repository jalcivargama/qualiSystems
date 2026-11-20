import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { DependencyTypesService } from './dependency-types.service';
import { DependencyType, DependencyTypeRequest } from './models/dependency-type.model';

type DependencyTypeRow = DependencyType & { _rowId: string };

type DependencyTypeForm = {
  typeCode: string;
  typeName: string;
};

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
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: DependencyTypeForm = this.emptyForm();

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

  get canSubmit(): boolean {
    return this.form.typeCode.trim().length > 0 && this.form.typeName.trim().length > 0;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formError.set('');
    this.saving.set(false);
  }

  save(): void {
    if (this.saving() || !this.canSubmit) return;

    const typeCode = this.form.typeCode.trim();
    const typeName = this.form.typeName.trim();

    if (!typeCode || !typeName) {
      this.formError.set('Completa los campos obligatorios.');
      return;
    }

    if (typeCode.length > 40) {
      this.formError.set('El código no puede superar 40 caracteres.');
      return;
    }

    if (typeName.length > 100) {
      this.formError.set('El nombre no puede superar 100 caracteres.');
      return;
    }

    const body: DependencyTypeRequest = { typeCode, typeName };

    this.saving.set(true);
    this.formError.set('');

    this.dependencyTypesService.createDependencyType(body).subscribe({
      next: () => {
        this.toastService.success('Tipo de dependencia creado correctamente');
        this.closeModal();
        this.loadDependencyTypes();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
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
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private toRow(type: DependencyType): DependencyTypeRow {
    return {
      ...type,
      _rowId: `dep-type-${type.dependencyTypeId ?? type.typeCode}`,
    };
  }

  private emptyForm(): DependencyTypeForm {
    return {
      typeCode: '',
      typeName: '',
    };
  }

  private resolveErrorMessage(error: HttpErrorResponse, action: 'list' | 'create'): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    if (error.status === 409) {
      return 'Conflicto: ya existe un tipo con ese código o nombre.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los tipos de dependencia.';
    return 'No fue posible crear el tipo de dependencia.';
  }
}
