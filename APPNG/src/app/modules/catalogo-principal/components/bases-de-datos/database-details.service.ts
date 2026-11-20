import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DatabaseDetail, DatabaseDetailRequest } from './models/database-detail.model';

@Injectable({ providedIn: 'root' })
export class DatabaseDetailsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllDatabaseDetails(): Observable<DatabaseDetail[]> {
    return this.http.get<DatabaseDetail[]>(`${this.baseUrl}/catalogos/database-details`);
  }

  createDatabaseDetail(body: DatabaseDetailRequest): Observable<DatabaseDetail> {
    return this.http.post<DatabaseDetail>(`${this.baseUrl}/catalogos/database-details`, body);
  }
}
