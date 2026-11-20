import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SystemResponsibility } from './models/system-responsibility.model';

@Injectable({ providedIn: 'root' })
export class SystemResponsibilitiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllSystemResponsibilities(): Observable<SystemResponsibility[]> {
    return this.http.get<SystemResponsibility[]>(
      `${this.baseUrl}/catalogos/system-responsibilities`,
    );
  }

  createSystemResponsibility(body: SystemResponsibility): Observable<SystemResponsibility> {
    return this.http.post<SystemResponsibility>(
      `${this.baseUrl}/catalogos/system-responsibilities`,
      body,
    );
  }

  updateSystemResponsibility(
    componentId: number,
    personId: number,
    roleId: number,
    body: SystemResponsibility,
  ): Observable<SystemResponsibility> {
    return this.http.put<SystemResponsibility>(
      `${this.baseUrl}/catalogos/system-responsibilities/${componentId}/${personId}/${roleId}`,
      body,
    );
  }

  deleteSystemResponsibility(
    componentId: number,
    personId: number,
    roleId: number,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/catalogos/system-responsibilities/${componentId}/${personId}/${roleId}`,
    );
  }
}
