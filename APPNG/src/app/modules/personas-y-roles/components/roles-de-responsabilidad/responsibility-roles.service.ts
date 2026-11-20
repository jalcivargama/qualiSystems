import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ResponsibilityRole } from './models/responsibility-role.model';

@Injectable({ providedIn: 'root' })
export class ResponsibilityRolesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllResponsibilityRoles(): Observable<ResponsibilityRole[]> {
    return this.http.get<ResponsibilityRole[]>(`${this.baseUrl}/catalogos/responsibility-roles`);
  }
}
