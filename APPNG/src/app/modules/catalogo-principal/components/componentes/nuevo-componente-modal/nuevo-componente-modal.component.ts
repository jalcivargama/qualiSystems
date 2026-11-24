import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of, switchMap, throwError } from 'rxjs';
import { ToastService } from '../../../../../core/toast.service';
import { PeopleService } from '../../../../personas-y-roles/components/personas/people.service';
import { Person } from '../../../../personas-y-roles/components/personas/models/person.model';
import { ResponsibilityRolesService } from '../../../../personas-y-roles/components/roles-de-responsabilidad/responsibility-roles.service';
import { ResponsibilityRole } from '../../../../personas-y-roles/components/roles-de-responsabilidad/models/responsibility-role.model';
import { SystemResponsibilitiesService } from '../../../../personas-y-roles/components/responsables-de-sistemas/system-responsibilities.service';
import { TechnologiesService } from '../../../../tecnologia/components/tecnologias/technologies.service';
import { Technology } from '../../../../tecnologia/components/tecnologias/models/technology.model';
import { ComponentTechnologiesService } from '../../../../tecnologia/components/stack-tecnologico/component-technologies.service';
import { SystemDeploymentsService } from '../../../../operacion/components/despliegues/system-deployments.service';
import { SystemDetailsService } from '../../sistemas/system-details.service';
import { SystemDetailRequest } from '../../sistemas/models/system-detail.model';
import { ComponentsService } from '../components.service';
import { CatalogComponent, ComponentRequest, ComponentType } from '../models/component.model';
import {
  AUTH_METHOD_OPTIONS,
  CRITICALITY_OPTIONS,
  DEPLOYMENT_ENVIRONMENTS,
  DeploymentEnvironment,
  ENVIRONMENT_CODES,
  EnvConfig,
  NUEVO_COMPONENTE_KIND_OPTIONS,
  NuevoComponenteForm,
  NuevoComponenteKind,
  PROTOCOL_OPTIONS,
  SYSTEM_STATUS_OPTIONS,
} from './nuevo-componente-modal.models';

@Component({
  selector: 'app-nuevo-componente-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-componente-modal.component.html',
  styleUrl: './nuevo-componente-modal.component.css',
})
export class NuevoComponenteModalComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly responsibilityRolesService = inject(ResponsibilityRolesService);
  private readonly systemResponsibilitiesService = inject(SystemResponsibilitiesService);
  private readonly technologiesService = inject(TechnologiesService);
  private readonly componentsService = inject(ComponentsService);
  private readonly systemDetailsService = inject(SystemDetailsService);
  private readonly systemDeploymentsService = inject(SystemDeploymentsService);
  private readonly componentTechnologiesService = inject(ComponentTechnologiesService);
  private readonly toastService = inject(ToastService);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly saved = output<NuevoComponenteForm>();

  readonly people = signal<Person[]>([]);
  readonly roles = signal<ResponsibilityRole[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly loadingCatalogs = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly kind = signal<NuevoComponenteKind | ''>('');
  readonly responsiblePersonId = signal<number | null>(null);
  readonly responsibleRoleId = signal<number | null>(null);
  readonly technologyIds = signal<number[]>([]);

  readonly activeFlagOptions = [
    { value: 'Y' as const, label: 'SÍ' },
    { value: 'N' as const, label: 'NO' },
  ];

  readonly kindOptions = NUEVO_COMPONENTE_KIND_OPTIONS;
  readonly protocolOptions = PROTOCOL_OPTIONS;
  readonly authMethodOptions = AUTH_METHOD_OPTIONS;
  readonly criticalityOptions = CRITICALITY_OPTIONS;
  readonly systemStatusOptions = SYSTEM_STATUS_OPTIONS;
  readonly deploymentEnvironments = DEPLOYMENT_ENVIRONMENTS;

  form = this.emptyCommonForm();
  system = this.emptySystem();
  deployments = this.emptyDeployments();
  frontend = this.emptyFrontend();
  api = this.emptyApi();
  database = this.emptyDatabase();

  readonly availablePeople = computed(() =>
    this.people().filter(
      (person) =>
        person.personId != null && String(person.isActive ?? 'Y').toUpperCase() === 'Y',
    ),
  );

  readonly availableRoles = computed(() =>
    this.roles().filter((role) => role.roleId != null),
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
    if (this.saving()) return;
    this.reset();
    this.closed.emit();
  }

  reset(): void {
    this.kind.set('');
    this.responsiblePersonId.set(null);
    this.responsibleRoleId.set(null);
    this.technologyIds.set([]);
    this.form = this.emptyCommonForm();
    this.system = this.emptySystem();
    this.deployments = this.emptyDeployments();
    this.frontend = this.emptyFrontend();
    this.api = this.emptyApi();
    this.database = this.emptyDatabase();
    this.formError.set('');
    this.saving.set(false);
  }

  onKindChange(kind: NuevoComponenteKind | ''): void {
    this.kind.set(kind);
    this.formError.set('');
    if (kind !== 'SYSTEM') {
      this.responsiblePersonId.set(null);
      this.responsibleRoleId.set(null);
    }
    this.system = this.emptySystem();
    this.deployments = this.emptyDeployments();
    this.frontend = this.emptyFrontend();
    this.api = this.emptyApi();
    this.database = this.emptyDatabase();
    this.technologyIds.set([]);
  }

  setResponsible(personId: number | string | null): void {
    if (personId == null || personId === '') {
      this.responsiblePersonId.set(null);
      return;
    }
    const id = Number(personId);
    this.responsiblePersonId.set(Number.isFinite(id) ? id : null);
  }

  setResponsibleRole(roleId: number | string | null): void {
    if (roleId == null || roleId === '') {
      this.responsibleRoleId.set(null);
      return;
    }
    const id = Number(roleId);
    this.responsibleRoleId.set(Number.isFinite(id) ? id : null);
  }

  personLabel(person: Person): string {
    const name = person.fullName?.trim() || String(person.personId ?? '—');
    const email = person.email?.trim();
    return email ? `${name} (${email})` : name;
  }

  roleLabel(role: ResponsibilityRole): string {
    const name = role.roleName?.trim() || String(role.roleId ?? '—');
    const code = role.roleCode?.trim();
    return code ? `${name} (${code})` : name;
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

  updateDeploymentUrl(index: number, url: string): void {
    this.deployments = this.deployments.map((deployment, depIndex) =>
      depIndex === index ? { ...deployment, url } : deployment,
    );
  }

  deploymentLabel(environment: DeploymentEnvironment): string {
    return (
      this.deploymentEnvironments.find((option) => option.value === environment)?.label ??
      environment
    );
  }

  submit(): void {
    if (this.saving()) return;

    const kind = this.kind();
    if (!kind) {
      this.formError.set('Selecciona el tipo de componente.');
      return;
    }

    const componentType = this.mapKindToComponentType(kind);
    if (!componentType) {
      this.formError.set('Este tipo de componente aún no está listo para guardarse.');
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

    const description = this.form.description.trim();
    const acronym = this.form.acronym.trim();
    const technologyIds = [...this.technologyIds()];

    const responsiblePersonId = kind === 'SYSTEM' ? this.responsiblePersonId() : null;
    const responsibleRoleId = kind === 'SYSTEM' ? this.responsibleRoleId() : null;

    if (kind === 'SYSTEM') {
      if (!this.system.systemStatus) {
        this.formError.set('Selecciona el estado del sistema.');
        return;
      }

      const ownerArea = this.system.ownerArea.trim();
      if (ownerArea.length > 200) {
        this.formError.set('El área propietaria no puede superar 200 caracteres.');
        return;
      }

      const goLiveDate = this.system.goLiveDate.trim();
      const endOfLifeDate = this.system.endOfLifeDate.trim();
      if (goLiveDate && endOfLifeDate && endOfLifeDate < goLiveDate) {
        this.formError.set(
          'La fecha de fin de vida no puede ser anterior a la puesta en producción.',
        );
        return;
      }

      const hasPerson = responsiblePersonId != null;
      const hasRole = responsibleRoleId != null;
      if (hasPerson !== hasRole) {
        this.formError.set('Para asignar responsable debes seleccionar persona y rol.');
        return;
      }

      const invalidDeploymentUrl = this.deployments.some(
        (deployment) => deployment.url.trim().length > 2000,
      );
      if (invalidDeploymentUrl) {
        this.formError.set('La URL de despliegue no puede superar 2000 caracteres.');
        return;
      }
    }

    const payload: NuevoComponenteForm = {
      kind,
      parentComponentId: null,
      isActive: this.form.isActive,
      name,
      acronym,
      description,
      responsiblePersonId,
      responsibleRoleId,
      technologyIds,
      system: structuredClone(this.system),
      deployments: structuredClone(this.deployments),
      frontend: structuredClone(this.frontend),
      api: structuredClone(this.api),
      database: structuredClone(this.database),
    };

    const componentBody: ComponentRequest = {
      componentType,
      name,
      isActive: this.form.isActive,
    };
    if (acronym) componentBody.acronym = acronym;
    if (description) componentBody.description = description;

    this.formError.set('');
    this.saving.set(true);

    this.componentsService
      .createNewComponent(componentBody)
      .pipe(
        switchMap((created) => this.afterComponentCreated(created, payload)),
        switchMap((componentId) => this.saveDeployments(componentId, payload)),
        switchMap((componentId) => this.saveSystemResponsibility(componentId, payload)),
        switchMap((componentId) => this.saveTechnologyStack(componentId, technologyIds)),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Componente creado correctamente');
          this.saved.emit(payload);
          this.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveSaveError(error));
        },
      });
  }

  private afterComponentCreated(
    created: CatalogComponent,
    payload: NuevoComponenteForm,
  ): Observable<number> {
    const componentId = Number(created.componentId);
    if (!Number.isFinite(componentId)) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'El componente se creó sin identificador.',
          }),
      );
    }

    if (payload.kind !== 'SYSTEM') {
      return of(componentId);
    }

    const ownerArea = payload.system.ownerArea.trim();
    const goLiveDate = payload.system.goLiveDate.trim();
    const endOfLifeDate = payload.system.endOfLifeDate.trim();
    const businessObjective = payload.description.trim();

    const systemBody: SystemDetailRequest = {
      componentId,
      systemStatus: payload.system.systemStatus,
      goLiveDate: goLiveDate || null,
      endOfLifeDate: endOfLifeDate || null,
    };
    if (businessObjective) systemBody.businessObjective = businessObjective;
    if (ownerArea) systemBody.ownerArea = ownerArea;
    if (payload.system.criticality) systemBody.criticality = payload.system.criticality;

    return this.systemDetailsService
      .createSystemDetail(systemBody)
      .pipe(switchMap(() => of(componentId)));
  }

  private saveDeployments(
    componentId: number,
    payload: NuevoComponenteForm,
  ): Observable<number> {
    if (payload.kind !== 'SYSTEM') {
      return of(componentId);
    }

    const toCreate = payload.deployments
      .map((deployment) => ({
        environment: deployment.environment,
        url: deployment.url.trim(),
      }))
      .filter((deployment) => deployment.url.length > 0);

    if (toCreate.length === 0) {
      return of(componentId);
    }

    return forkJoin(
      toCreate.map((deployment) =>
        this.systemDeploymentsService.createSystemDeployment({
          componentId,
          environment: deployment.environment,
          url: deployment.url,
        }),
      ),
    ).pipe(switchMap(() => of(componentId)));
  }

  private saveSystemResponsibility(
    componentId: number,
    payload: NuevoComponenteForm,
  ): Observable<number> {
    if (
      payload.kind !== 'SYSTEM' ||
      payload.responsiblePersonId == null ||
      payload.responsibleRoleId == null
    ) {
      return of(componentId);
    }

    return this.systemResponsibilitiesService
      .createSystemResponsibility({
        componentId,
        personId: payload.responsiblePersonId,
        roleId: payload.responsibleRoleId,
      })
      .pipe(switchMap(() => of(componentId)));
  }

  private saveTechnologyStack(componentId: number, technologyIds: number[]): Observable<number> {
    if (technologyIds.length === 0) {
      return of(componentId);
    }

    return this.componentTechnologiesService
      .createComponentTechnologiesBatch({
        componentId,
        technologies: technologyIds,
        version: '',
        isPrimary: 'N',
      })
      .pipe(switchMap(() => of(componentId)));
  }

  private mapKindToComponentType(kind: NuevoComponenteKind): ComponentType | null {
    switch (kind) {
      case 'SYSTEM':
        return 'SYSTEM';
      case 'API':
        return 'API';
      case 'DATABASE':
        return 'DATABASE';
      default:
        return null;
    }
  }

  private emptyCommonForm() {
    return {
      isActive: 'Y' as const,
      name: '',
      acronym: '',
      description: '',
    };
  }

  private emptySystem() {
    return {
      ownerArea: '',
      criticality: '' as const,
      systemStatus: 'ACTIVE' as const,
      goLiveDate: '',
      endOfLifeDate: '',
    };
  }

  private emptyDeployments() {
    return DEPLOYMENT_ENVIRONMENTS.map((option) => ({
      environment: option.value,
      url: '',
    }));
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

    this.responsibilityRolesService.getAllResponsibilityRoles().subscribe({
      next: (roles) => this.roles.set(roles ?? []),
      error: (error: HttpErrorResponse) => {
        this.roles.set([]);
        this.toastService.error(this.resolveCatalogError(error, 'roles'));
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

  private resolveSaveError(error: HttpErrorResponse): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.statusText && error.status === 500 && error.statusText.includes('identificador')) {
      return error.statusText;
    }
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    if (error.status === 409) {
      return 'Conflicto al guardar: el componente, detalle o stack ya existe.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    return 'No fue posible completar el alta del componente.';
  }
}
