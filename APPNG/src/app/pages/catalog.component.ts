import { CommonModule } from '@angular/common';
import { Component, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CatalogDefinition,
  CatalogField,
  CatalogStoreService,
  MockRecord,
} from '../core/catalog-store.service';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (definition) {
      <div class="page-heading">
        <div>
          <div class="breadcrumbs"><a routerLink="/dashboard">Workspace</a><span>/</span><a routerLink="/catalogos/catalog_component">Catálogos</a><span>/</span><strong>{{ definition.title }}</strong></div>
          <h1>{{ definition.title }}</h1>
          <p>{{ definition.description }}</p>
        </div>
        <button class="primary-button" (click)="openCreate()"><span>＋</span> Nuevo registro</button>
      </div>

      <div class="catalog-toolbar">
        <div class="catalog-count"><span class="table-icon">▤</span><strong>{{ definition.table }}</strong><span class="record-count">{{ filteredRows.length }} registros</span></div>
        <div class="toolbar-actions">
          <label class="search-box"><span>⌕</span><input [(ngModel)]="searchTerm" placeholder="Buscar registros..." aria-label="Buscar registros" /><kbd>⌘ K</kbd></label>
          <button class="filter-button" (click)="searchTerm = ''"><span>☷</span> Limpiar</button>
        </div>
      </div>

      @if (notice) { <div class="notice" role="status">{{ notice }}</div> }
      @if (error) { <div class="error-banner" role="alert">{{ error }}</div> }

      <section class="table-card">
        <div class="table-scroll">
          <table>
            <thead><tr>
              @for (field of visibleFields; track field.key) { <th>{{ field.label }}</th> }
              <th class="actions-header">ACCIONES</th>
            </tr></thead>
            <tbody>
              @for (row of filteredRows; track row._mockId) {
                <tr>
                  @for (field of visibleFields; track field.key) {
                    <td [title]="value(row, field.key)">{{ value(row, field.key) || '—' }}</td>
                  }
                  <td class="row-actions">
                    <button class="row-action edit-action" (click)="openEdit(row)" [attr.aria-label]="'Editar ' + definition.title">Editar</button>
                    <button class="row-action delete-action" (click)="deleteRow(row)" [attr.aria-label]="'Eliminar registro'">Eliminar</button>
                  </td>
                </tr>
              } @empty {
                <tr><td class="empty-cell" [attr.colspan]="visibleFields.length + 1">
                  <span class="empty-illustration">▤</span>
                  <strong>{{ searchTerm ? 'No encontramos resultados' : 'Aún no hay registros' }}</strong>
                  <small>{{ searchTerm ? 'Prueba con otro término de búsqueda.' : 'Crea el primer registro de este catálogo para comenzar.' }}</small>
                  @if (!searchTerm) { <button class="text-create" (click)="openCreate()">＋ Crear registro</button> }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span>Mostrando <strong>{{ filteredRows.length }}</strong> de <strong>{{ rows.length }}</strong> registros</span>
          <span class="mock-badge"><i></i> Mock local · Cambios guardados en este navegador</span>
        </div>
      </section>
      <div class="catalog-hint"><span>i</span> Prototipo: las relaciones usan IDs mock. Este formulario todavía no se conecta a una base Oracle.</div>

      @if (modalOpen) {
        <div class="modal-backdrop" (click)="closeModal()">
          <section class="record-modal" role="dialog" aria-modal="true" [attr.aria-label]="isEditing ? 'Editar registro' : 'Crear registro'" (click)="$event.stopPropagation()">
            <div class="modal-heading">
              <div><span class="panel-kicker">{{ definition.table }}</span><h2>{{ isEditing ? 'Editar registro' : 'Nuevo registro' }}</h2><p>{{ isEditing ? 'Actualiza los datos del registro seleccionado.' : 'Completa los campos para agregarlo al catálogo.' }}</p></div>
              <button class="modal-close" aria-label="Cerrar" (click)="closeModal()">×</button>
            </div>
            <form (ngSubmit)="save()">
              <div class="form-grid">
                @for (field of formFields; track field.key) {
                  <div class="form-field" [class.full-width]="field.type === 'textarea'">
                    <label [for]="'field-' + field.key">{{ field.label }} @if (field.required) { <i>*</i> }</label>
                    @if (field.type === 'textarea') {
                      <textarea [id]="'field-' + field.key" [name]="field.key" [(ngModel)]="form[field.key]" [required]="!!field.required" [readonly]="isEditing && isKeyField(field.key)" rows="3" [placeholder]="'Ingresa ' + field.label.toLowerCase()"></textarea>
                    } @else if (field.type === 'select') {
                      <select [id]="'field-' + field.key" [name]="field.key" [(ngModel)]="form[field.key]" [required]="!!field.required" [disabled]="isEditing && isKeyField(field.key)">
                        <option value="">Selecciona una opción</option>
                        @for (option of field.options ?? []; track option) { <option [value]="option">{{ option }}</option> }
                      </select>
                    } @else {
                      <input [id]="'field-' + field.key" [name]="field.key" [type]="field.type ?? 'text'" [(ngModel)]="form[field.key]" [required]="!!field.required" [readonly]="isEditing && isKeyField(field.key)" [placeholder]="'Ingresa ' + field.label.toLowerCase()" />
                    }
                  </div>
                }
              </div>
              @if (formError) { <div class="error-banner" role="alert">{{ formError }}</div> }
              <div class="modal-actions"><button type="button" class="secondary-button" (click)="closeModal()">Cancelar</button><button type="submit" class="primary-button">{{ isEditing ? 'Guardar cambios' : 'Crear registro' }}</button></div>
            </form>
          </section>
        </div>
      }
    } @else {
      <section class="not-found"><span>?</span><h1>Catálogo no disponible</h1><p>No existe un catálogo con ese nombre.</p><a routerLink="/dashboard">Volver al dashboard</a></section>
    }
  `,
  styleUrl: './catalog.component.css',
})
export class CatalogComponent {
  definition?: CatalogDefinition;
  rows: MockRecord[] = [];
  searchTerm = '';
  modalOpen = false;
  isEditing = false;
  editId?: string;
  form: Record<string, string> = {};
  formError = '';
  error = '';
  notice = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: CatalogStoreService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.loadCatalog(params.get('table'));
    });
  }

  get visibleFields(): CatalogField[] {
    return (this.definition?.fields ?? []).filter((field) => !field.hidden);
  }

  get formFields(): CatalogField[] {
    return (this.definition?.fields ?? []).filter((field) => !field.hidden);
  }

  get filteredRows(): MockRecord[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    if (!query) return this.rows;
    return this.rows.filter((row) =>
      this.visibleFields.some((field) => String(row[field.key] ?? '').toLocaleLowerCase().includes(query)),
    );
  }

  value(row: MockRecord, key: string): string {
    return String(row[key] ?? '');
  }

  isKeyField(key: string): boolean {
    return this.definition?.keyFields.includes(key) ?? false;
  }

  openCreate(): void {
    this.isEditing = false;
    this.editId = undefined;
    this.formError = '';
    this.form = {};
    for (const field of this.formFields) {
      this.form[field.key] = field.type === 'select' ? field.options?.[0] ?? '' : '';
    }
    this.modalOpen = true;
    this.notice = '';
  }

  openEdit(row: MockRecord): void {
    this.isEditing = true;
    this.editId = row._mockId;
    this.formError = '';
    this.form = {};
    for (const field of this.formFields) this.form[field.key] = String(row[field.key] ?? '');
    this.modalOpen = true;
    this.notice = '';
  }

  save(): void {
    if (!this.definition) return;
    try {
      this.store.save(this.definition.table, this.form, this.editId);
      this.rows = this.store.getRecords(this.definition.table);
      this.notice = this.isEditing ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.';
      this.closeModal();
    } catch (error) {
      this.formError = error instanceof Error ? error.message : 'No fue posible guardar el registro.';
    }
  }

  deleteRow(row: MockRecord): void {
    if (!this.definition || !window.confirm('¿Eliminar este registro del prototipo?')) return;
    try {
      this.store.remove(this.definition.table, row._mockId);
      this.rows = this.store.getRecords(this.definition.table);
      this.notice = 'Registro eliminado del prototipo.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No fue posible eliminar el registro.';
    }
  }

  closeModal(): void {
    this.modalOpen = false;
    this.formError = '';
  }

  private loadCatalog(table: string | null): void {
    this.definition = this.store.getDefinition(table);
    this.searchTerm = '';
    this.notice = '';
    this.error = '';
    if (this.definition) this.rows = this.store.getRecords(this.definition.table);
  }
}
