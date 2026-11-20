import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  SystemDeployment,
  SystemDeploymentRequest,
  SystemDeploymentUpdateRequest,
} from './models/system-deployment.model';

@Injectable({ providedIn: 'root' })
export class SystemDeploymentsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllSystemDeployments(): Observable<SystemDeployment[]> {
    return this.http.get<SystemDeployment[]>(`${this.baseUrl}/catalogos/system-deployments`);
  }

  createSystemDeployment(body: SystemDeploymentRequest): Observable<SystemDeployment> {
    return this.http.post<SystemDeployment>(`${this.baseUrl}/catalogos/system-deployments`, body);
  }

  updateSystemDeployment(
    id: number,
    body: SystemDeploymentUpdateRequest,
  ): Observable<SystemDeployment> {
    return this.http.put<SystemDeployment>(
      `${this.baseUrl}/catalogos/system-deployments/${id}`,
      body,
    );
  }
}
