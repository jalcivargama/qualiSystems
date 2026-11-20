import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  SystemDetail,
  SystemDetailRequest,
  SystemDetailUpdateRequest,
} from './models/system-detail.model';

@Injectable({ providedIn: 'root' })
export class SystemDetailsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllSystemDetails(): Observable<SystemDetail[]> {
    return this.http.get<SystemDetail[]>(`${this.baseUrl}/catalogos/system-details`);
  }

  createSystemDetail(body: SystemDetailRequest): Observable<SystemDetail> {
    return this.http.post<SystemDetail>(`${this.baseUrl}/catalogos/system-details`, body);
  }

  updateSystemDetail(id: number, body: SystemDetailUpdateRequest): Observable<SystemDetail> {
    return this.http.put<SystemDetail>(`${this.baseUrl}/catalogos/system-details/${id}`, body);
  }
}
