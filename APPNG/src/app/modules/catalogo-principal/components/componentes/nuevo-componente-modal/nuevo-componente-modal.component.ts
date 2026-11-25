import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { concatMap, forkJoin, from, Observable, of, switchMap, throwError, toArray } from 'rxjs';
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
import { ApisService } from '../../apis/apis.service';
import { ApiDetailRequest } from '../../apis/models/api-detail.model';
import { DatabaseDetailsService } from '../../bases-de-datos/database-details.service';
import { DatabaseDetailRequest } from '../../bases-de-datos/models/database-detail.model';
import { SystemDetailsService } from '../../sistemas/system-details.service';
import { SystemDetailRequest } from '../../sistemas/models/system-detail.model';
import { ComponentsService } from '../components.service';
import { CatalogComponent, ComponentRequest, ComponentType } from '../models/component.model';
import {
  transformInputToLowerCase,
  transformPasteToLowerCase,
} from '../../../../../shared/functions/input.functions';
import { TIPOS_RECURSOS_OPTIONS } from '../../../../../shared/enum/tipos.recuros.enum';
import {
  CRITICALITY_OPTIONS,
  DEPLOYMENT_ENVIRONMENTS,
  DeploymentEnvironment,
  ENVIRONMENT_CODES,
  EnvConfig,
  MAX_NUEVO_COMPONENTES,
  NUEVO_COMPONENTE_KIND_OPTIONS,
  NuevoComponenteDraft,
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
  private readonly apisService = inject(ApisService);
  private readonly databaseDetailsService = inject(DatabaseDetailsService);
  private readonly systemDeploymentsService = inject(SystemDeploymentsService);
  private readonly componentTechnologiesService = inject(ComponentTechnologiesService);
  private readonly toastService = inject(ToastService);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly saved = output<NuevoComponenteForm[]>();

  readonly people = signal<Person[]>([]);
  readonly roles = signal<ResponsibilityRole[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly drafts = signal<NuevoComponenteDraft[]>([]);
  readonly loadingCatalogs = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly showTypePicker = signal(false);
  readonly pendingKind = signal<NuevoComponenteKind | ''>('');

  readonly activeFlagOptions = [
    { value: 'Y' as const, label: 'SÍ' },
    { value: 'N' as const, label: 'NO' },
  ];

  readonly kindOptions = NUEVO_COMPONENTE_KIND_OPTIONS;
  readonly protocolOptions = PROTOCOL_OPTIONS;
  readonly criticalityOptions = CRITICALITY_OPTIONS;
  readonly systemStatusOptions = SYSTEM_STATUS_OPTIONS;
  readonly deploymentEnvironments = DEPLOYMENT_ENVIRONMENTS;
  readonly resourceTypeOptions = TIPOS_RECURSOS_OPTIONS;
  readonly maxComponents = MAX_NUEVO_COMPONENTES;
  readonly transformToLowerCase = transformInputToLowerCase;
  readonly transformPasteToLower = transformPasteToLowerCase;

  private seq = 0;

  readonly availablePeople = computed(() =>
    this.people().filter(
      (person) =>
        person.personId != null && String(person.isActive ?? 'Y').toUpperCase() === 'Y',
    ),
  );

  readonly availableRoles = computed(() =>
    this.roles().filter((role) => role.roleId != null),
  );

  readonly availableKindOptions = computed(() => {
    const used = new Set(this.drafts().map((draft) => draft.kind));
    return this.kindOptions.filter((option) => !used.has(option.value));
  });

  readonly canAddMore = computed(
    () => this.drafts().length < this.maxComponents && this.availableKindOptions().length > 0,
  );

  ngOnInit(): void {
    this.loadCatalogs();
  }

  close(): void {
    if (this.saving()) return;
    this.reset();
    this.closed.emit();
  }

  reset(): void {
    this.drafts.set([]);
    this.formError.set('');
    this.saving.set(false);
    this.showTypePicker.set(false);
    this.pendingKind.set('');
  }

  kindLabel(kind: NuevoComponenteKind): string {
    return this.kindOptions.find((option) => option.value === kind)?.label ?? kind;
  }

  toggleTypePicker(): void {
    if (!this.canAddMore() && !this.showTypePicker()) return;
    this.showTypePicker.update((open) => !open);
    this.pendingKind.set('');
  }

  onKindSelected(kind: NuevoComponenteKind | ''): void {
    if (!kind) return;
    if (!this.canAddMore()) {
      this.formError.set('Solo puedes agregar hasta 3 componentes, uno de cada tipo.');
      return;
    }
    if (this.drafts().some((draft) => draft.kind === kind)) {
      this.formError.set('Ya agregaste un componente de ese tipo.');
      return;
    }

    this.drafts.update((list) => [...list, this.createDraft(kind)]);
    this.pendingKind.set('');
    this.showTypePicker.set(false);
    this.formError.set('');
  }

  removeDraft(draftId: string): void {
    if (this.saving()) return;
    this.drafts.update((list) => list.filter((draft) => draft.id !== draftId));
    this.formError.set('');
  }

  patchCommonField(
    draftId: string,
    field: 'name' | 'acronym' | 'resourceType' | 'description' | 'isActive',
    value: string,
  ): void {
    this.drafts.update((list) =>
      list.map((draft) => (draft.id === draftId ? { ...draft, [field]: value } : draft)),
    );
  }

  setResponsible(draftId: string, personId: number | string | null): void {
    const id = this.toId(personId);
    this.drafts.update((list) =>
      list.map((draft) =>
        draft.id === draftId ? { ...draft, responsiblePersonId: id } : draft,
      ),
    );
  }

  setResponsibleRole(draftId: string, roleId: number | string | null): void {
    const id = this.toId(roleId);
    this.drafts.update((list) =>
      list.map((draft) =>
        draft.id === draftId ? { ...draft, responsibleRoleId: id } : draft,
      ),
    );
  }

  patchSystemField(
    draftId: string,
    field: 'ownerArea' | 'criticality' | 'systemStatus' | 'goLiveDate' | 'endOfLifeDate',
    value: string,
  ): void {
    this.drafts.update((list) =>
      list.map((draft) =>
        draft.id === draftId
          ? { ...draft, system: { ...draft.system, [field]: value } }
          : draft,
      ),
    );
  }

  patchApiField(
    draftId: string,
    field: 'apiVersion' | 'url' | 'urlDoc' | 'protocol' | 'authenticationMethod' | 'slaDescription',
    value: string,
  ): void {
    this.drafts.update((list) =>
      list.map((draft) =>
        draft.id === draftId ? { ...draft, api: { ...draft.api, [field]: value } } : draft,
      ),
    );
  }

  patchDatabaseField(
    draftId: string,
    field: 'engine' | 'engineVersion' | 'instanceName' | 'schemaName',
    value: string,
  ): void {
    this.drafts.update((list) =>
      list.map((draft) =>
        draft.id === draftId
          ? { ...draft, database: { ...draft.database, [field]: value } }
          : draft,
      ),
    );
  }

  updateDeploymentUrl(draftId: string, index: number, url: string): void {
    this.drafts.update((list) =>
      list.map((draft) => {
        if (draft.id !== draftId) return draft;
        const deployments = draft.deployments.map((deployment, depIndex) =>
          depIndex === index ? { ...deployment, url } : deployment,
        );
        return { ...draft, deployments };
      }),
    );
  }

  toggleTechnology(draftId: string, technologyId: number): void {
    this.drafts.update((list) =>
      list.map((draft) => {
        if (draft.id !== draftId) return draft;
        const selected = draft.technologyIds.includes(technologyId);
        return {
          ...draft,
          technologyIds: selected
            ? draft.technologyIds.filter((id) => id !== technologyId)
            : [...draft.technologyIds, technologyId],
        };
      }),
    );
  }

  removeTechnology(draftId: string, technologyId: number): void {
    this.drafts.update((list) =>
      list.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              technologyIds: draft.technologyIds.filter((id) => id !== technologyId),
            }
          : draft,
      ),
    );
  }

  selectedTechnologies(draft: NuevoComponenteDraft): Technology[] {
    const selected = new Set(draft.technologyIds);
    return this.technologies().filter(
      (tech) => tech.technologyId != null && selected.has(tech.technologyId),
    );
  }

  availableTechnologies(draft: NuevoComponenteDraft): Technology[] {
    const selected = new Set(draft.technologyIds);
    return this.technologies().filter(
      (tech) => tech.technologyId != null && !selected.has(tech.technologyId),
    );
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

  deploymentLabel(environment: DeploymentEnvironment): string {
    return (
      this.deploymentEnvironments.find((option) => option.value === environment)?.label ??
      environment
    );
  }

  submit(): void {
    if (this.saving()) return;

    const drafts = this.drafts();
    if (drafts.length === 0) {
      this.formError.set('Agrega al menos un componente.');
      return;
    }

    const kinds = drafts.map((draft) => draft.kind);
    if (new Set(kinds).size !== kinds.length) {
      this.formError.set('Solo se permite un componente de cada tipo.');
      return;
    }

    for (const draft of drafts) {
      const error = this.validateDraft(draft);
      if (error) {
        this.formError.set(`${this.kindLabel(draft.kind)}: ${error}`);
        return;
      }
    }

    const payloads = drafts.map((draft) => this.toPayload(draft));
    this.formError.set('');
    this.saving.set(true);

    from(payloads)
      .pipe(
        concatMap((payload) => this.saveOne(payload)),
        toArray(),
      )
      .subscribe({
        next: (created) => {
          const count = created.length;
          this.toastService.success(
            count === 1
              ? 'Componente creado correctamente'
              : `${count} componentes creados correctamente`,
          );
          this.saved.emit(created);
          this.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveSaveError(error));
        },
      });
  }

  private validateDraft(draft: NuevoComponenteDraft): string | null {
    const name = draft.name.trim();
    if (!name) return 'El nombre es obligatorio.';
    if (!draft.isActive) return 'Selecciona si el componente está activo.';

    if (draft.kind === 'SYSTEM') {
      if (!draft.system.systemStatus) return 'Selecciona el estado del sistema.';

      const ownerArea = draft.system.ownerArea.trim();
      if (ownerArea.length > 200) {
        return 'El área propietaria no puede superar 200 caracteres.';
      }

      const goLiveDate = draft.system.goLiveDate.trim();
      const endOfLifeDate = draft.system.endOfLifeDate.trim();
      if (goLiveDate && endOfLifeDate && endOfLifeDate < goLiveDate) {
        return 'La fecha de fin de vida no puede ser anterior a la puesta en producción.';
      }

      const hasPerson = draft.responsiblePersonId != null;
      const hasRole = draft.responsibleRoleId != null;
      if (hasPerson !== hasRole) {
        return 'Para asignar responsable debes seleccionar persona y rol.';
      }

      if (draft.deployments.some((deployment) => deployment.url.trim().length > 2000)) {
        return 'La URL de despliegue no puede superar 2000 caracteres.';
      }
    }

    if (draft.kind === 'API') {
      if (draft.api.apiVersion.trim().length > 50) {
        return 'La versión de API no puede superar 50 caracteres.';
      }
      if (draft.api.url.trim().length > 2000) {
        return 'La URL Estado del API no puede superar 2000 caracteres.';
      }
      if (draft.api.urlDoc.trim().length > 2000) {
        return 'La URL Documentación del API no puede superar 2000 caracteres.';
      }
      if (draft.api.protocol.trim().length > 30) {
        return 'El protocolo no puede superar 30 caracteres.';
      }
      if (draft.api.authenticationMethod.trim().length > 100) {
        return 'El método de autenticación no puede superar 100 caracteres.';
      }
      if (draft.deployments.some((deployment) => deployment.url.trim().length > 2000)) {
        return 'La URL de despliegue no puede superar 2000 caracteres.';
      }
    }

    if (draft.kind === 'DATABASE') {
      const engine = draft.database.engine.trim();
      if (!engine) return 'El motor de base de datos es obligatorio.';
      if (engine.length > 100) return 'El motor no puede superar 100 caracteres.';
      if (draft.database.engineVersion.trim().length > 100) {
        return 'La versión no puede superar 100 caracteres.';
      }
      if (draft.database.instanceName.trim().length > 200) {
        return 'La instancia no puede superar 200 caracteres.';
      }
      if (draft.database.schemaName.trim().length > 200) {
        return 'El esquema no puede superar 200 caracteres.';
      }
    }

    return null;
  }

  private toPayload(draft: NuevoComponenteDraft): NuevoComponenteForm {
    const { id: _id, ...rest } = draft;
    return {
      ...structuredClone(rest),
      name: draft.name.trim(),
      acronym: draft.acronym.trim(),
      resourceType: draft.resourceType.trim(),
      description: draft.description.trim(),
      responsiblePersonId: draft.kind === 'SYSTEM' ? draft.responsiblePersonId : null,
      responsibleRoleId: draft.kind === 'SYSTEM' ? draft.responsibleRoleId : null,
      technologyIds: [...draft.technologyIds],
    };
  }

  private saveOne(payload: NuevoComponenteForm): Observable<NuevoComponenteForm> {
    const componentType = this.mapKindToComponentType(payload.kind);
    if (!componentType) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Tipo de componente no soportado.',
          }),
      );
    }

    const componentBody: ComponentRequest = {
      componentType,
      name: payload.name,
      isActive: payload.isActive,
    };
    if (payload.acronym) componentBody.acronym = payload.acronym;
    if (payload.resourceType) componentBody.resourceType = payload.resourceType;
    if (payload.description) componentBody.description = payload.description;

    return this.componentsService.createNewComponent(componentBody).pipe(
      switchMap((created) => this.afterComponentCreated(created, payload)),
      switchMap((componentId) => this.saveDeployments(componentId, payload)),
      switchMap((componentId) => this.saveSystemResponsibility(componentId, payload)),
      switchMap((componentId) =>
        this.saveTechnologyStack(componentId, payload.technologyIds),
      ),
      switchMap(() => of(payload)),
    );
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

    if (payload.kind === 'SYSTEM') {
      return this.saveSystemDetail(componentId, payload);
    }

    if (payload.kind === 'API') {
      return this.saveApiDetail(componentId, payload);
    }

    if (payload.kind === 'DATABASE') {
      return this.saveDatabaseDetail(componentId, payload);
    }

    return of(componentId);
  }

  private saveSystemDetail(
    componentId: number,
    payload: NuevoComponenteForm,
  ): Observable<number> {
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

  private saveApiDetail(
    componentId: number,
    payload: NuevoComponenteForm,
  ): Observable<number> {
    const apiVersion = payload.api.apiVersion.trim();
    const url = payload.api.url.trim();
    const urlDoc = payload.api.urlDoc.trim();
    const protocol = payload.api.protocol.trim();
    const authenticationMethod = payload.api.authenticationMethod.trim();
    const slaDescription = payload.api.slaDescription.trim();

    const apiBody: ApiDetailRequest = { componentId };
    if (apiVersion) apiBody.apiVersion = apiVersion;
    if (url) apiBody.url = url;
    if (urlDoc) apiBody.urlDoc = urlDoc;
    if (protocol) apiBody.protocol = protocol;
    if (authenticationMethod) apiBody.authenticationMethod = authenticationMethod;
    if (slaDescription) apiBody.slaDescription = slaDescription;

    return this.apisService.createApiDetail(apiBody).pipe(switchMap(() => of(componentId)));
  }

  private saveDatabaseDetail(
    componentId: number,
    payload: NuevoComponenteForm,
  ): Observable<number> {
    const engine = payload.database.engine.trim();
    const engineVersion = payload.database.engineVersion.trim();
    const instanceName = payload.database.instanceName.trim().toLowerCase();
    const schemaName = payload.database.schemaName.trim();

    const databaseBody: DatabaseDetailRequest = { componentId, engine };
    if (engineVersion) databaseBody.engineVersion = engineVersion;
    if (instanceName) databaseBody.instanceName = instanceName;
    if (schemaName) databaseBody.schemaName = schemaName;

    return this.databaseDetailsService
      .createDatabaseDetail(databaseBody)
      .pipe(switchMap(() => of(componentId)));
  }

  private saveDeployments(
    componentId: number,
    payload: NuevoComponenteForm,
  ): Observable<number> {
    if (payload.kind !== 'SYSTEM' && payload.kind !== 'API') {
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

  private createDraft(kind: NuevoComponenteKind): NuevoComponenteDraft {
    return {
      id: `cmp-${++this.seq}`,
      kind,
      parentComponentId: null,
      isActive: 'Y',
      name: '',
      acronym: '',
      resourceType: '',
      description: '',
      responsiblePersonId: null,
      responsibleRoleId: null,
      technologyIds: [],
      system: {
        ownerArea: '',
        criticality: '',
        systemStatus: 'ACTIVE',
        goLiveDate: '',
        endOfLifeDate: '',
      },
      deployments: DEPLOYMENT_ENVIRONMENTS.map((option) => ({
        environment: option.value,
        url: '',
      })),
      frontend: { environments: this.emptyEnvironments() },
      api: {
        apiVersion: '',
        url: '',
        urlDoc: '',
        protocol: '',
        authenticationMethod: '',
        slaDescription: '',
      },
      database: {
        engine: '',
        engineVersion: '',
        instanceName: '',
        schemaName: '',
      },
    };
  }

  private emptyEnvironments(): EnvConfig[] {
    return ENVIRONMENT_CODES.map((env) => ({ env, version: '', url: '' }));
  }

  private toId(value: number | string | null | undefined): number | null {
    if (value == null || value === '') return null;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
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
