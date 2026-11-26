import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../../../core/toast.service';
import { TIPOS_AUTENTIFICACION_OPTIONS } from '../../../../../shared/enum/tipos.autentificacion.enum';
import { SearchableSelectComponent } from '../../../../../shared/ui/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../../../shared/ui/searchable-select/searchable-select.models';
import { PeopleService } from '../../../../personas-y-roles/components/personas/people.service';
import { Person } from '../../../../personas-y-roles/components/personas/models/person.model';
import { TechnologiesService } from '../../../../tecnologia/components/tecnologias/technologies.service';
import { Technology } from '../../../../tecnologia/components/tecnologias/models/technology.model';
import {
  COMPONENT_KIND_OPTIONS,
  ENVIRONMENT_CODES,
  EnvConfig,
  NuevoSistemaForm,
  PROTOCOL_OPTIONS,
  SystemChildComponent,
  SystemComponentKind,
} from './nuevo-sistema-modal.models';

type SystemBaseForm = {
  isActive: 'Y' | 'N';
  name: string;
  acronym: string;
  description: string;
};

@Component({
  selector: 'app-nuevo-sistema-modal',
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './nuevo-sistema-modal.component.html',
  styleUrl: './nuevo-sistema-modal.component.css',
})
export class NuevoSistemaModalComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly technologiesService = inject(TechnologiesService);
  private readonly toastService = inject(ToastService);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly saved = output<NuevoSistemaForm>();

  readonly people = signal<Person[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly loadingCatalogs = signal(false);
  readonly formError = signal('');
  readonly showTypePicker = signal(false);
  readonly pendingKind = signal<SystemComponentKind | ''>('');
  readonly responsiblePersonId = signal<number | null>(null);
  readonly components = signal<SystemChildComponent[]>([]);

  readonly activeFlagOptions = [
    { value: 'Y' as const, label: 'SÍ' },
    { value: 'N' as const, label: 'NO' },
  ];

  readonly componentKindOptions = COMPONENT_KIND_OPTIONS;
  readonly protocolOptions = PROTOCOL_OPTIONS;
  readonly authMethodOptions = TIPOS_AUTENTIFICACION_OPTIONS;
  readonly environmentCodes = ENVIRONMENT_CODES;

  form: SystemBaseForm = this.emptyBaseForm();

  private seq = 0;

  readonly availablePeople = computed(() =>
    this.people().filter(
      (person) =>
        person.personId != null && String(person.isActive ?? 'Y').toUpperCase() === 'Y',
    ),
  );

  readonly peopleOptions = computed<SearchableSelectOption[]>(() =>
    this.availablePeople().map((person) => ({
      value: Number(person.personId),
      label: person.fullName?.trim() || String(person.personId),
      searchText: person.email?.trim() || '',
    })),
  );

  ngOnInit(): void {
    this.loadCatalogs();
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  reset(): void {
    this.form = this.emptyBaseForm();
    this.responsiblePersonId.set(null);
    this.components.set([]);
    this.formError.set('');
    this.showTypePicker.set(false);
    this.pendingKind.set('');
  }

  personLabel(person: Person): string {
    const name = person.fullName?.trim() || String(person.personId ?? '—');
    const email = person.email?.trim();
    return email ? `${name} (${email})` : name;
  }

  setResponsible(personId: number | string | null): void {
    if (personId == null || personId === '') {
      this.responsiblePersonId.set(null);
      return;
    }
    const id = Number(personId);
    this.responsiblePersonId.set(Number.isFinite(id) ? id : null);
  }

  toggleTypePicker(): void {
    this.showTypePicker.update((open) => !open);
    this.pendingKind.set('');
  }

  onKindSelected(kind: SystemComponentKind | ''): void {
    if (!kind) return;
    this.addComponent(kind);
    this.pendingKind.set('');
    this.showTypePicker.set(false);
  }

  addComponent(kind: SystemComponentKind): void {
    this.components.update((list) => [...list, this.createComponent(kind)]);
  }

  removeComponent(componentId: string): void {
    this.components.update((list) => list.filter((component) => component.id !== componentId));
  }

  kindLabel(kind: SystemComponentKind): string {
    return this.componentKindOptions.find((option) => option.value === kind)?.label ?? kind;
  }

  toggleTechnology(componentId: string, technologyId: number): void {
    this.components.update((list) =>
      list.map((component) => {
        if (component.id !== componentId) return component;
        const selected = component.technologyIds.includes(technologyId);
        return {
          ...component,
          technologyIds: selected
            ? component.technologyIds.filter((id) => id !== technologyId)
            : [...component.technologyIds, technologyId],
        };
      }),
    );
  }

  removeTechnology(componentId: string, technologyId: number): void {
    this.components.update((list) =>
      list.map((component) =>
        component.id === componentId
          ? {
              ...component,
              technologyIds: component.technologyIds.filter((id) => id !== technologyId),
            }
          : component,
      ),
    );
  }

  availableTechnologies(component: SystemChildComponent): Technology[] {
    const selected = new Set(component.technologyIds);
    return this.technologies().filter(
      (tech) => tech.technologyId != null && !selected.has(tech.technologyId),
    );
  }

  selectedTechnologies(component: SystemChildComponent): Technology[] {
    const selected = new Set(component.technologyIds);
    return this.technologies().filter(
      (tech) => tech.technologyId != null && selected.has(tech.technologyId),
    );
  }

  patchApiField(
    componentId: string,
    field: 'protocol' | 'authenticationMethod',
    value: string,
  ): void {
    this.components.update((list) =>
      list.map((component) =>
        component.id === componentId && component.kind === 'API'
          ? { ...component, [field]: value }
          : component,
      ),
    );
  }

  patchDatabaseField(
    componentId: string,
    field: 'engine' | 'engineVersion' | 'instanceName' | 'schemaName' | 'jndiName',
    value: string,
  ): void {
    this.components.update((list) =>
      list.map((component) =>
        component.id === componentId && component.kind === 'DATABASE'
          ? { ...component, [field]: value }
          : component,
      ),
    );
  }

  updateEnvField(
    componentId: string,
    envIndex: number,
    field: 'version' | 'url',
    value: string,
  ): void {
    this.components.update((list) =>
      list.map((component) => {
        if (component.id !== componentId || !('environments' in component)) return component;
        const environments = component.environments.map((env, index) =>
          index === envIndex ? { ...env, [field]: value } : env,
        );
        return { ...component, environments };
      }),
    );
  }

  submit(): void {
    const name = this.form.name.trim();
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }

    if (!this.form.isActive) {
      this.formError.set('Selecciona si el sistema está activo.');
      return;
    }

    this.formError.set('');
    const payload: NuevoSistemaForm = {
      isActive: this.form.isActive,
      name,
      acronym: this.form.acronym.trim(),
      description: this.form.description.trim(),
      responsiblePersonId: this.responsiblePersonId(),
      components: this.components().map((component) => structuredClone(component)),
    };

    this.saved.emit(payload);
    this.toastService.success('Formulario de nuevo sistema listo');
    this.close();
  }

  private createComponent(kind: SystemComponentKind): SystemChildComponent {
    const id = `cmp-${++this.seq}`;
    if (kind === 'FRONTEND') {
      return {
        id,
        kind: 'FRONTEND',
        environments: this.emptyEnvironments(),
        technologyIds: [],
      };
    }
    if (kind === 'API') {
      return {
        id,
        kind: 'API',
        protocol: 'REST',
        authenticationMethod: 'JWT',
        environments: this.emptyEnvironments(),
        technologyIds: [],
      };
    }
    return {
      id,
      kind: 'DATABASE',
      engine: '',
      engineVersion: '',
      instanceName: '',
      schemaName: '',
      jndiName: '',
      technologyIds: [],
    };
  }

  private emptyEnvironments(): EnvConfig[] {
    return this.environmentCodes.map((env) => ({ env, version: '', url: '' }));
  }

  private emptyBaseForm(): SystemBaseForm {
    return {
      isActive: 'Y',
      name: '',
      acronym: '',
      description: '',
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
