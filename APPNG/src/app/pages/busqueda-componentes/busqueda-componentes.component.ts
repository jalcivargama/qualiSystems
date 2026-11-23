import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import {
  ComponentType,
} from '../../modules/catalogo-principal/components/componentes/models/component.model';
import { Technology } from '../../modules/tecnologia/components/tecnologias/models/technology.model';
import { TechnologiesService } from '../../modules/tecnologia/components/tecnologias/technologies.service';
import { Person } from '../../modules/personas-y-roles/components/personas/models/person.model';
import { PeopleService } from '../../modules/personas-y-roles/components/personas/people.service';
import { ComponentSearchService } from './component-search.service';
import {
  ComponentSearchCriteria,
  ComponentSearchResult,
} from './models/component-search.model';

interface SearchForm {
  componentTypes: ComponentType[];
  name: string;
  acronym: string;
  technologyIds: number[];
  personIds: number[];
}

@Component({
  selector: 'app-busqueda-componentes',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './busqueda-componentes.component.html',
  styleUrl: './busqueda-componentes.component.css',
})
export class BusquedaComponentesComponent implements OnInit {
  private readonly searchService = inject(ComponentSearchService);
  private readonly technologiesService = inject(TechnologiesService);
  private readonly peopleService = inject(PeopleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly componentTypes: Array<{ value: ComponentType; label: string }> = [
    { value: 'SYSTEM', label: 'Sistema' },
    { value: 'API', label: 'API' },
    { value: 'DATABASE', label: 'Base de datos' },
    { value: 'INFRASTRUCTURE', label: 'Infraestructura' },
    { value: 'EXTERNAL_SERVICE', label: 'Servicio externo' },
    { value: 'MESSAGING', label: 'Mensajería' },
  ];

  technologies: Technology[] = [];
  people: Person[] = [];
  results: ComponentSearchResult[] = [];
  loadingOptions = false;
  searching = false;
  hasSearched = false;
  form: SearchForm = this.emptyForm();

  ngOnInit(): void {
    this.loadOptions();
  }

  search(): void {
    const criteria = this.criteria();
    if (!this.hasCriteria(criteria)) {
      this.toastService.warning('Ingresa al menos un criterio de búsqueda');
      return;
    }

    this.searching = true;
    this.searchService.search(criteria).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (results) => {
        this.results = results;
        this.searching = false;
        this.hasSearched = true;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.results = [];
        this.searching = false;
        this.hasSearched = true;
        this.toastService.error('No se pudo realizar la búsqueda', this.errorMessage(error));
        this.changeDetector.markForCheck();
      },
    });
  }

  clear(): void {
    this.form = this.emptyForm();
    this.results = [];
    this.hasSearched = false;
  }

  openComponent(result: ComponentSearchResult): void {
    void this.router.navigate(['/explorador-dependencias'], {
      queryParams: { componentId: result.componentId },
    });
  }

  technologySummary(result: ComponentSearchResult): string {
    return result.technologies
      .map((technology) =>
        technology.version
          ? `${technology.name} · ${technology.version}`
          : technology.name,
      )
      .join(', ');
  }

  responsibilitySummary(result: ComponentSearchResult): string {
    return result.responsibilities
      .map((responsibility) => `${responsibility.fullName} (${responsibility.roleName})`)
      .join(', ');
  }

  private loadOptions(): void {
    this.loadingOptions = true;
    forkJoin({
      technologies: this.technologiesService.getAllTechnologies(),
      people: this.peopleService.getPeople(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ technologies, people }) => {
        this.technologies = technologies
          .filter((technology) => technology.technologyId != null)
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));
        this.people = people
          .filter((person) => person.personId != null && person.isActive === 'Y')
          .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
        this.loadingOptions = false;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loadingOptions = false;
        this.toastService.error(
          'No se pudieron cargar los filtros',
          this.errorMessage(error),
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  private criteria(): ComponentSearchCriteria {
    const textOrNull = (value: string): string | null => value.trim() || null;
    return {
      componentTypes: this.form.componentTypes,
      name: textOrNull(this.form.name),
      acronym: textOrNull(this.form.acronym),
      technologyIds: this.form.technologyIds.map(Number),
      personIds: this.form.personIds.map(Number),
    };
  }

  private hasCriteria(criteria: ComponentSearchCriteria): boolean {
    return Boolean(
      criteria.componentTypes.length ||
        criteria.name ||
        criteria.acronym ||
        criteria.technologyIds.length ||
        criteria.personIds.length,
    );
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error instanceof Error) return error.message;
    if (error.status === 0) return 'No fue posible conectar con la API en localhost.';
    if (typeof error.error?.['message'] === 'string') return error.error['message'];
    return `La API respondió con el estado ${error.status}.`;
  }

  private emptyForm(): SearchForm {
    return {
      componentTypes: [],
      name: '',
      acronym: '',
      technologyIds: [],
      personIds: [],
    };
  }
}
