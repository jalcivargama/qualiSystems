import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  InfrastructureDetail,
  InfrastructureDetailRequest,
  InfrastructureDetailUpdateRequest,
} from './models/infrastructure-detail.model';

@Injectable({ providedIn: 'root' })
export class InfrastructureDetailsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllInfrastructureDetails(): Observable<InfrastructureDetail[]> {
    return this.http.get<InfrastructureDetail[]>(
      `${this.baseUrl}/catalogos/infrastructure-details`,
    );
  }

  createInfrastructureDetail(
    body: InfrastructureDetailRequest,
  ): Observable<InfrastructureDetail> {
    return this.http.post<InfrastructureDetail>(
      `${this.baseUrl}/catalogos/infrastructure-details`,
      body,
    );
  }

  updateInfrastructureDetail(
    id: number,
    body: InfrastructureDetailUpdateRequest,
  ): Observable<InfrastructureDetail> {
    return this.http.put<InfrastructureDetail>(
      `${this.baseUrl}/catalogos/infrastructure-details/${id}`,
      body,
    );
  }
}
