import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CatalogDefinition,
  CatalogField,
  CatalogStoreService,
  MockRecord,
} from '../../../core/catalog-store.service';

@Component({
  selector: 'app-catalog-table',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog-table.component.html',
  styleUrl: './catalog-table.component.css',
})
export class CatalogTableComponent implements OnChanges {
  @Input({ required: true }) table!: string;

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

  constructor(private readonly store: CatalogStoreService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['table']) {
      this.loadCatalog(this.table);
    }
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
