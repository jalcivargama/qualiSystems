import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../../core/toast.service';
import { SearchableSelectComponent } from '../../../../../shared/ui/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../../../shared/ui/searchable-select/searchable-select.models';
import { ComponentsService } from '../../componentes/components.service';
import { CatalogComponent } from '../../componentes/models/component.model';
import { ApisService } from '../apis.service';
import {
  ApiDetail,
  ApiDetailRequest,
  ApiDetailUpdateRequest,
} from '../models/api-detail.model';

type ApiRow = ApiDetail & { _rowId: string };

type ApiForm = {
  componentId: number | null;
  apiVersion: string;
  url: string;
  urlDoc: string;
  certificateValidity: string;
  protocol: string;
  authenticationMethod: string;
  slaDescription: string;
};

@Component({
  selector: 'app-apis',
  imports: [CommonModule, FormsModule, RouterLink, SearchableSelectComponent],
  templateUrl: './apis.component.html',
  styleUrl: './apis.component.css',
})
export class ApisComponent implements OnInit {
  private readonly apisService = inject(ApisService);
  private readonly componentsService = inject(ComponentsService);
  private readonly toastService = inject(ToastService);

  readonly protocolOptions = ['REST', 'SOAP', 'GraphQL', 'gRPC', 'HTTPS', 'HTTP', 'Otro'];

  readonly rows = signal<ApiRow[]>([]);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly editingComponentId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formError = signal('');
  form: ApiForm = this.emptyForm();

  readonly availableApiComponents = computed(() => {
    const editingId = this.editingComponentId();
    const usedIds = new Set(
      this.rows()
        .map((row) => Number(row.componentId))
        .filter((id) => Number.isFinite(id) && id !== editingId),
    );
    return this.components().filter((component) => {
      const type = String(component.componentType ?? '').trim().toUpperCase();
      const active = String(component.isActive ?? '').trim().toUpperCase();
      const id = Number(component.componentId);
      return type === 'API' && active === 'Y' && Number.isFinite(id) && !usedIds.has(id);
    });
  });

  readonly apiComponentOptions = computed<SearchableSelectOption[]>(() =>
    this.availableApiComponents().map((component) => ({
      value: Number(component.componentId),
      label: component.name?.trim() || String(component.componentId),
      group: 'API',
      searchText: component.acronym?.trim() || '',
    })),
  );

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) =>
      [
        this.componentName(row.componentId),
        row.apiVersion,
        row.url,
        row.urlDoc,
        row.certificateValidity,
        row.protocol,
        row.authenticationMethod,
        row.slaDescription,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadApiDetails();
    this.loadComponents();
  }

  get canSubmit(): boolean {
    const componentId = this.resolveComponentId() ?? this.editingComponentId();
    return componentId != null;
  }

  onComponentIdChange(value: number | string | null): void {
    this.form.componentId = this.toComponentId(value);
  }

  componentName(componentId: number | null | undefined): string {
    if (componentId == null) return '—';
    const match = this.components().find(
      (component) => Number(component.componentId) === Number(componentId),
    );
    return match?.name?.trim() || '—';
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingComponentId.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.modalOpen.set(true);
    this.loadComponents();
  }

  openEdit(row: ApiRow): void {
    const componentId = this.toComponentId(row.componentId);
    this.isEditing.set(true);
    this.editingComponentId.set(componentId);
    this.form = {
      componentId,
      apiVersion: row.apiVersion ?? '',
      url: row.url ?? '',
      urlDoc: row.urlDoc ?? '',
      certificateValidity: row.certificateValidity ?? '',
      protocol: row.protocol ?? '',
      authenticationMethod: row.authenticationMethod ?? '',
      slaDescription: row.slaDescription ?? '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.isEditing.set(false);
    this.editingComponentId.set(null);
    this.formError.set('');
    this.saving.set(false);
    this.deleting.set(false);
  }

  deleteCurrent(): void {
    if (!this.isEditing() || this.saving() || this.deleting()) return;

    const id = this.editingComponentId() ?? this.resolveComponentId();
    if (id == null) {
      this.toastService.error('No se pudo identificar el detalle de API a eliminar.');
      return;
    }

    const label = this.componentName(id);
    if (!window.confirm(`¿Eliminar el detalle de API "${label !== '—' ? label : id}"?`)) {
      return;
    }

    this.deleting.set(true);
    this.formError.set('');

    this.apisService.deleteApiDetail(id).subscribe({
      next: () => {
        this.toastService.success('Detalle de API eliminado correctamente');
        this.closeModal();
        this.loadApiDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'delete'));
      },
    });
  }

  save(): void {
    if (this.saving() || this.deleting() || !this.canSubmit) return;

    const componentId = this.resolveComponentId() ?? this.editingComponentId();
    if (componentId == null) {
      this.formError.set('Selecciona un componente API.');
      return;
    }

    const apiVersion = this.form.apiVersion.trim();
    const url = this.form.url.trim();
    const urlDoc = this.form.urlDoc.trim();
    const certificateValidity = this.form.certificateValidity.trim();
    const protocol = this.form.protocol.trim();
    const authenticationMethod = this.form.authenticationMethod.trim();
    const slaDescription = this.form.slaDescription.trim();

    if (apiVersion.length > 50) {
      this.formError.set('La versión no puede superar 50 caracteres.');
      return;
    }
    if (url.length > 2000) {
      this.formError.set('La URL Estado del API no puede superar 2000 caracteres.');
      return;
    }
    if (urlDoc.length > 2000) {
      this.formError.set('La URL Documentación del API no puede superar 2000 caracteres.');
      return;
    }
    if (certificateValidity && !/^\d{4}-\d{2}-\d{2}$/.test(certificateValidity)) {
      this.formError.set('La validez del certificado debe tener formato YYYY-MM-DD.');
      return;
    }
    if (protocol.length > 30) {
      this.formError.set('El protocolo no puede superar 30 caracteres.');
      return;
    }
    if (authenticationMethod.length > 100) {
      this.formError.set('El método de autenticación no puede superar 100 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    this.form.componentId = componentId;

    if (this.isEditing()) {
      const updateBody: ApiDetailUpdateRequest = {
        componentId,
        apiVersion: apiVersion || null,
        url: url || null,
        urlDoc: urlDoc || null,
        certificateValidity: certificateValidity || null,
        protocol: protocol || null,
        authenticationMethod: authenticationMethod || null,
        slaDescription: slaDescription || null,
      };

      this.apisService.updateApiDetail(componentId, updateBody).subscribe({
        next: () => {
          this.toastService.success('Detalle de API actualizado correctamente');
          this.closeModal();
          this.loadApiDetails();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.toastService.error(this.resolveErrorMessage(error, 'update'));
        },
      });
      return;
    }

    const createBody: ApiDetailRequest = { componentId };
    if (apiVersion) createBody.apiVersion = apiVersion;
    if (url) createBody.url = url;
    if (urlDoc) createBody.urlDoc = urlDoc;
    if (certificateValidity) createBody.certificateValidity = certificateValidity;
    if (protocol) createBody.protocol = protocol;
    if (authenticationMethod) createBody.authenticationMethod = authenticationMethod;
    if (slaDescription) createBody.slaDescription = slaDescription;

    this.apisService.createApiDetail(createBody).subscribe({
      next: () => {
        this.toastService.success('Detalle de API creado correctamente');
        this.closeModal();
        this.loadApiDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(this.resolveErrorMessage(error, 'create'));
      },
    });
  }

  private loadApiDetails(): void {
    this.loading.set(true);
    this.apisService.getAllApiDetails().subscribe({
      next: (details) => {
        this.rows.set(details.map((detail) => this.toRow(detail)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.rows.set([]);
        this.toastService.error(this.resolveErrorMessage(error, 'list'));
      },
    });
  }

  private loadComponents(): void {
    this.componentsService.getComponents().subscribe({
      next: (components) => {
        this.components.set(Array.isArray(components) ? components : []);
      },
      error: () => {
        this.components.set([]);
      },
    });
  }

  private toRow(detail: ApiDetail): ApiRow {
    return {
      ...detail,
      _rowId: `api-${detail.componentId}`,
    };
  }

  private emptyForm(): ApiForm {
    return {
      componentId: null,
      apiVersion: '',
      url: '',
      urlDoc: '',
      certificateValidity: '',
      protocol: '',
      authenticationMethod: '',
      slaDescription: '',
    };
  }

  private resolveComponentId(): number | null {
    return this.toComponentId(this.form.componentId);
  }

  private toComponentId(value: number | string | null | undefined): number | null {
    if (value == null || value === '') return null;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }

  private resolveErrorMessage(
    error: HttpErrorResponse,
    action: 'list' | 'create' | 'update' | 'delete',
  ): string {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.msg === 'string' && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 401) return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes autorización para esta operación.';
    if (error.status === 404) return 'El detalle de API no existe o ya fue eliminado.';
    if (error.status === 409) {
      if (action === 'delete') {
        return 'No se puede eliminar: la API tiene registros relacionados.';
      }
      return action === 'update'
        ? 'No se puede actualizar por restricciones relacionadas.'
        : 'Conflicto: el componente ya tiene detalle o no es de tipo API.';
    }
    if (error.status === 400) return 'Datos inválidos. Revisa el formulario.';
    if (action === 'list') return 'No fue posible cargar los detalles de API.';
    if (action === 'update') return 'No fue posible actualizar el detalle de API.';
    if (action === 'delete') return 'No fue posible eliminar el detalle de API.';
    return 'No fue posible crear el detalle de API.';
  }
}
