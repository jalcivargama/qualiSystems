import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ResponsibilityRole,
  ResponsibilityRoleRequest,
} from './models/responsibility-role.model';

@Injectable({ providedIn: 'root' })
export class ResponsibilityRolesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllResponsibilityRoles(): Observable<ResponsibilityRole[]> {
    return this.http.get<ResponsibilityRole[]>(`${this.baseUrl}/catalogos/responsibility-roles`);
  }

  createResponsibilityRole(body: ResponsibilityRoleRequest): Observable<ResponsibilityRole> {
    return this.http.post<ResponsibilityRole>(
      `${this.baseUrl}/catalogos/responsibility-roles`,
      body,
    );
  }

  updateResponsibilityRole(
    id: number,
    body: ResponsibilityRoleRequest,
  ): Observable<ResponsibilityRole> {
    return this.http.put<ResponsibilityRole>(
      `${this.baseUrl}/catalogos/responsibility-roles/${id}`,
      body,
    );
  }

  deleteResponsibilityRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/catalogos/responsibility-roles/${id}`);
  }
}
