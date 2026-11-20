import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiDetail, ApiDetailRequest } from './models/api-detail.model';

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
}
