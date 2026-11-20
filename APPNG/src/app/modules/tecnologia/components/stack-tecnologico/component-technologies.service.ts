import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ComponentTechnology,
  ComponentTechnologyUpdateRequest,
} from './models/component-technology.model';

@Injectable({ providedIn: 'root' })
export class ComponentTechnologiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllComponentTechnologies(): Observable<ComponentTechnology[]> {
    return this.http.get<ComponentTechnology[]>(`${this.baseUrl}/catalogos/component-technologies`);
  }

  createComponentTechnology(body: ComponentTechnology): Observable<ComponentTechnology> {
    return this.http.post<ComponentTechnology>(
      `${this.baseUrl}/catalogos/component-technologies`,
      body,
    );
  }

  updateComponentTechnology(
    componentId: number,
    technologyId: number,
    body: ComponentTechnologyUpdateRequest,
  ): Observable<ComponentTechnology> {
    return this.http.put<ComponentTechnology>(
      `${this.baseUrl}/catalogos/component-technologies/${componentId}/${technologyId}`,
      body,
    );
  }

  deleteComponentTechnology(componentId: number, technologyId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/catalogos/component-technologies/${componentId}/${technologyId}`,
    );
  }
}
