import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CatalogComponent, ComponentRequest } from './models/component.model';

@Injectable({ providedIn: 'root' })
export class ComponentsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getComponents(): Observable<CatalogComponent[]> {
    return this.http.get<CatalogComponent[]>(`${this.baseUrl}/catalogos/componentes`);
  }

  createNewComponent(body: ComponentRequest): Observable<CatalogComponent> {
    return this.http.post<CatalogComponent>(`${this.baseUrl}/catalogos/componentes`, body);
  }

  updateComponent(id: number, body: ComponentRequest): Observable<CatalogComponent> {
    return this.http.put<CatalogComponent>(`${this.baseUrl}/catalogos/componentes/${id}`, body);
  }
}
