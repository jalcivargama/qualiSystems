import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CreateNewComponentDto } from './models/create.component.dto';
import { CreateComponentResponseDto } from './models/create.component.response.dto';
import { CatalogComponent, UpdateComponentDto } from './models/catalog.component';

@Injectable({ providedIn: 'root' })
export class ComponentsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getComponents(): Observable<CatalogComponent[]> {
    return this.http.get<CatalogComponent[]>(`${this.baseUrl}/catalogos/componentes`);
  }

  createNewComponent(dto: CreateNewComponentDto): Observable<CreateComponentResponseDto> {
    return this.http.post<CreateComponentResponseDto>(`${this.baseUrl}/catalogos/componentes`, dto);
  }

  updateComponent(id: number, body: UpdateComponentDto): Observable<CatalogComponent> {
    return this.http.put<CatalogComponent>(`${this.baseUrl}/catalogos/componentes/${id}`, body);
  }
}
