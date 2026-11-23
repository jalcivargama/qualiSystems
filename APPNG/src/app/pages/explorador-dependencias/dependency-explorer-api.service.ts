import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/response.type';
import {
  DependencyExplorerOption,
  DependencyExplorerResponse,
} from './models/dependency-explorer-option.model';

@Injectable({ providedIn: 'root' })
export class DependencyExplorerApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getComponents(): Observable<DependencyExplorerOption[]> {
    return this.http
      .get<DependencyExplorerOption[] | ApiResponse<DependencyExplorerOption[]>>(
        `${this.baseUrl}/catalogos/dependency-explorer/components`,
      )
      .pipe(map((response) => this.unwrapList(response)));
  }

  getComponent(componentId: number): Observable<DependencyExplorerResponse> {
    return this.http
      .get<DependencyExplorerResponse | ApiResponse<DependencyExplorerResponse>>(
        `${this.baseUrl}/catalogos/dependency-explorer/components/${componentId}`,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrapList(
    response: DependencyExplorerOption[] | ApiResponse<DependencyExplorerOption[]>,
  ): DependencyExplorerOption[] {
    const value = this.payload(response);
    if (!Array.isArray(value)) {
      throw new Error('El endpoint de componentes no devolvió una lista.');
    }
    return value;
  }

  private unwrap(
    response: DependencyExplorerResponse | ApiResponse<DependencyExplorerResponse>,
  ): DependencyExplorerResponse {
    const value = this.payload(response);
    if (!value || typeof value !== 'object' || !('component' in value)) {
      throw new Error('El endpoint de componente no devolvió un detalle válido.');
    }
    return value as DependencyExplorerResponse;
  }

  private payload<T>(response: T | ApiResponse<T>): T {
    if (
      response &&
      typeof response === 'object' &&
      'codigo' in response &&
      'msg' in response
    ) {
      if (!('body' in response) || response.body === undefined) {
        throw new Error(String(response.msg) || 'La API no devolvió el cuerpo de la respuesta.');
      }
      return response.body as T;
    }
    return response as T;
  }
}
