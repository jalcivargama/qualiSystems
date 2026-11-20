import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/toast.service';
import { PeopleService } from './people.service';
import { ActiveFlag, Person } from './models/person.model';

type PersonRow = Person & { _rowId: string };

@Component({
  selector: 'app-personas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './personas.component.html',
  styleUrl: './personas.component.css',
})
export class PersonasComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly toastService = inject(ToastService);

  private readonly activeFlagLabels: Record<ActiveFlag, string> = {
    Y: 'SÍ',
    N: 'NO',
  };

  readonly rows = signal<PersonRow[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        row.fullName,
        row.email,
        row.organization,
        this.labelForActiveFlag(row.isActive),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadPeople();
  }

  labelForActiveFlag(value: string | null | undefined): string {
    if (!value) return '—';
    return this.activeFlagLabels[value as ActiveFlag] ?? value;
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private loadPeople(): void {
    this.loading.set(true);
    this.peopleService.getPeople().subscribe({
      next: (people) => {
        this.rows.set(people.map((person) => this.toRow(person)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error));
      },
    });
  }

  private toRow(person: Person): PersonRow {
    return {
      ...person,
      _rowId: `api-${person.personId ?? person.fullName}`,
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
    return 'No fue posible cargar las personas.';
  }
}
