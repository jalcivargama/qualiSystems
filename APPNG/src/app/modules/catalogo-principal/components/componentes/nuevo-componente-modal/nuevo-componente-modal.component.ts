import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../../../core/toast.service';
import { PeopleService } from '../../../../personas-y-roles/components/personas/people.service';
import { Person } from '../../../../personas-y-roles/components/personas/models/person.model';
import { TechnologiesService } from '../../../../tecnologia/components/tecnologias/technologies.service';
import { Technology } from '../../../../tecnologia/components/tecnologias/models/technology.model';
import { ComponentsService } from '../components.service';
import { CatalogComponent } from '../models/component.model';
import {
  AUTH_METHOD_OPTIONS,
  ENVIRONMENT_CODES,
  EnvConfig,
  NUEVO_COMPONENTE_KIND_OPTIONS,
  NuevoComponenteForm,
  NuevoComponenteKind,
  PROTOCOL_OPTIONS,
} from './nuevo-componente-modal.models';

@Component({
  selector: 'app-nuevo-componente-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-componente-modal.component.html',
  styleUrl: './nuevo-componente-modal.component.css',
})
export class NuevoComponenteModalComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly technologiesService = inject(TechnologiesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly saved = output<NuevoComponenteForm>();

  readonly people = signal<Person[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly parentCandidates = signal<CatalogComponent[]>([]);
  readonly loadingCatalogs = signal(false);
  readonly formError = signal('');

  readonly kind = signal<NuevoComponenteKind | ''>('');
  readonly parentComponentId = signal<number | null>(null);
  readonly responsiblePersonId = signal<number | null>(null);
  readonly technologyIds = signal<number[]>([]);

  readonly activeFlagOptions = [
    { value: 'Y' as const, label: 'SÍ' },
    { value: 'N' as const, label: 'NO' },
  ];

  readonly kindOptions = NUEVO_COMPONENTE_KIND_OPTIONS;
  readonly protocolOptions = PROTOCOL_OPTIONS;
  readonly authMethodOptions = AUTH_METHOD_OPTIONS;

  form = this.emptyCommonForm();
  frontend = this.emptyFrontend();
  api = this.emptyApi();
  database = this.emptyDatabase();

  readonly requiresParent = computed(() => {
    const kind = this.kind();
    return kind !== '' && kind !== 'SYSTEM';
  });

  readonly availablePeople = computed(() =>
    this.people().filter(
      (person) =>
        person.personId != null && String(person.isActive ?? 'Y').toUpperCase() === 'Y',
    ),
  );

  readonly parentOptions = computed(() =>
    this.parentCandidates().filter((component) => {
      const type = String(component.componentType ?? '').trim().toUpperCase();
      const active = String(component.isActive ?? 'Y').trim().toUpperCase();
      return type === 'SYSTEM' && active === 'Y' && component.componentId != null;
    }),
  );

  readonly selectedTechnologies = computed(() => {
    const selected = new Set(this.technologyIds());
    return this.technologies().filter(
      (tech) => tech.technologyId != null && selected.has(tech.technologyId),
    );
  });

  readonly availableTechnologies = computed(() => {
    const selected = new Set(this.technologyIds());
    return this.technologies().filter(
      (tech) => tech.technologyId != null && !selected.has(tech.technologyId),
    );
  });

  ngOnInit(): void {
    this.loadCatalogs();
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  reset(): void {
    this.kind.set('');
    this.parentComponentId.set(null);
    this.responsiblePersonId.set(null);
    this.technologyIds.set([]);
    this.form = this.emptyCommonForm();
    this.frontend = this.emptyFrontend();
    this.api = this.emptyApi();
    this.database = this.emptyDatabase();
    this.formError.set('');
  }

  onKindChange(kind: NuevoComponenteKind | ''): void {
    this.kind.set(kind);
    this.formError.set('');
    if (kind === 'SYSTEM' || kind === '') {
      this.parentComponentId.set(null);
    }
    if (kind !== 'SYSTEM') {
      this.responsiblePersonId.set(null);
    }
    this.frontend = this.emptyFrontend();
    this.api = this.emptyApi();
    this.database = this.emptyDatabase();
    this.technologyIds.set([]);
  }

  setParent(componentId: number | string | null): void {
    if (componentId == null || componentId === '') {
      this.parentComponentId.set(null);
      return;
    }
    const id = Number(componentId);
    this.parentComponentId.set(Number.isFinite(id) ? id : null);
  }

  setResponsible(personId: number | string | null): void {
    if (personId == null || personId === '') {
      this.responsiblePersonId.set(null);
      return;
    }
    const id = Number(personId);
    this.responsiblePersonId.set(Number.isFinite(id) ? id : null);
  }

  personLabel(person: Person): string {
    const name = person.fullName?.trim() || String(person.personId ?? '—');
    const email = person.email?.trim();
    return email ? `${name} (${email})` : name;
  }

  parentLabel(component: CatalogComponent): string {
    const name = component.name?.trim() || String(component.componentId ?? '—');
    const acronym = component.acronym?.trim();
    return acronym ? `${name} (${acronym})` : name;
  }

  toggleTechnology(technologyId: number): void {
    this.technologyIds.update((ids) =>
      ids.includes(technologyId) ? ids.filter((id) => id !== technologyId) : [...ids, technologyId],
    );
  }

  removeTechnology(technologyId: number): void {
    this.technologyIds.update((ids) => ids.filter((id) => id !== technologyId));
  }

  updateEnvField(
    target: 'frontend' | 'api',
    envIndex: number,
    field: 'version' | 'url',
    value: string,
  ): void {
    const source = target === 'frontend' ? this.frontend : this.api;
    source.environments = source.environments.map((env, index) =>
      index === envIndex ? { ...env, [field]: value } : env,
    );
  }

  submit(): void {
    const kind = this.kind();
    if (!kind) {
      this.formError.set('Selecciona el tipo de componente.');
      return;
    }

    const name = this.form.name.trim();
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }

    if (!this.form.isActive) {
      this.formError.set('Selecciona si el componente está activo.');
      return;
    }

    if (kind !== 'SYSTEM' && this.parentComponentId() == null) {
      this.formError.set('Selecciona el componente padre.');
      return;
    }

    this.formError.set('');
    const payload: NuevoComponenteForm = {
      kind,
      parentComponentId: kind === 'SYSTEM' ? null : this.parentComponentId(),
      isActive: this.form.isActive,
      name,
      acronym: this.form.acronym.trim(),
      description: this.form.description.trim(),
      responsiblePersonId: kind === 'SYSTEM' ? this.responsiblePersonId() : null,
      technologyIds: [...this.technologyIds()],
      frontend: structuredClone(this.frontend),
      api: structuredClone(this.api),
      database: structuredClone(this.database),
    };

    this.saved.emit(payload);
    this.toastService.success('Formulario de nuevo componente listo');
    this.close();
  }

  private emptyCommonForm() {
    return {
      isActive: 'Y' as const,
      name: '',
      acronym: '',
      description: '',
    };
  }

  private emptyEnvironments(): EnvConfig[] {
    return ENVIRONMENT_CODES.map((env) => ({ env, version: '', url: '' }));
  }

  private emptyFrontend() {
    return { environments: this.emptyEnvironments() };
  }

  private emptyApi() {
    return {
      protocol: 'REST',
      authenticationMethod: 'JWT',
      environments: this.emptyEnvironments(),
    };
  }

  private emptyDatabase() {
    return {
      engine: '',
      engineVersion: '',
      instanceName: '',
      schemaName: '',
      jndiName: '',
    };
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);

    this.peopleService.getPeople().subscribe({
      next: (people) => this.people.set(people ?? []),
      error: (error: HttpErrorResponse) => {
        this.people.set([]);
        this.toastService.error(this.resolveCatalogError(error, 'personas'));
      },
    });

    this.componentsService.getComponents().subscribe({
      next: (components) => this.parentCandidates.set(components ?? []),
      error: (error: HttpErrorResponse) => {
        this.parentCandidates.set([]);
        this.toastService.error(this.resolveCatalogError(error, 'componentes'));
      },
    });

    this.technologiesService.getAllTechnologies().subscribe({
      next: (technologies) => {
        this.technologies.set(technologies ?? []);
        this.loadingCatalogs.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.technologies.set([]);
        this.loadingCatalogs.set(false);
        this.toastService.error(this.resolveCatalogError(error, 'tecnologías'));
      },
    });
  }

  private resolveCatalogError(error: HttpErrorResponse, catalog: string): string {
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return `No tienes autorización para consultar ${catalog}.`;
    return `No fue posible cargar el catálogo de ${catalog}.`;
  }
}
