import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Dependency, DependencyRequest } from './models/dependency.model';

@Injectable({ providedIn: 'root' })
export class DependenciesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllDependencies(): Observable<Dependency[]> {
    return this.http.get<Dependency[]>(`${this.baseUrl}/catalogos/dependencies`);
  }

  createDependency(body: DependencyRequest): Observable<Dependency> {
    return this.http.post<Dependency>(`${this.baseUrl}/catalogos/dependencies`, body);
  }

  updateDependency(id: number, body: DependencyRequest): Observable<Dependency> {
    return this.http.put<Dependency>(`${this.baseUrl}/catalogos/dependencies/${id}`, body);
  }
}
