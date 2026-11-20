import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ApiDetail,
  ApiDetailRequest,
  ApiDetailUpdateRequest,
} from './models/api-detail.model';

@Injectable({ providedIn: 'root' })
export class ApisService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllApiDetails(): Observable<ApiDetail[]> {
    return this.http.get<ApiDetail[]>(`${this.baseUrl}/catalogos/api-details`);
  }

  createApiDetail(body: ApiDetailRequest): Observable<ApiDetail> {
    return this.http.post<ApiDetail>(`${this.baseUrl}/catalogos/api-details`, body);
  }

  updateApiDetail(id: number, body: ApiDetailUpdateRequest): Observable<ApiDetail> {
    return this.http.put<ApiDetail>(`${this.baseUrl}/catalogos/api-details/${id}`, body);
  }

  deleteApiDetail(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/catalogos/api-details/${id}`);
  }
}
