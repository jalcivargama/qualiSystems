import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DependencyType, DependencyTypeRequest } from './models/dependency-type.model';

@Injectable({ providedIn: 'root' })
export class DependencyTypesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllDependencyTypes(): Observable<DependencyType[]> {
    return this.http.get<DependencyType[]>(`${this.baseUrl}/catalogos/dependency-types`);
  }

  createDependencyType(body: DependencyTypeRequest): Observable<DependencyType> {
    return this.http.post<DependencyType>(`${this.baseUrl}/catalogos/dependency-types`, body);
  }

  updateDependencyType(id: number, body: DependencyTypeRequest): Observable<DependencyType> {
    return this.http.put<DependencyType>(`${this.baseUrl}/catalogos/dependency-types/${id}`, body);
  }

  deleteDependencyType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/catalogos/dependency-types/${id}`);
  }
}
