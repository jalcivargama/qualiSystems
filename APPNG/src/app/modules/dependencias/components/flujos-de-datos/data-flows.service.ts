import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DataFlow, DataFlowRequest } from './models/data-flow.model';

@Injectable({ providedIn: 'root' })
export class DataFlowsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllDataFlows(): Observable<DataFlow[]> {
    return this.http.get<DataFlow[]>(`${this.baseUrl}/catalogos/data-flows`);
  }

  createDataFlow(body: DataFlowRequest): Observable<DataFlow> {
    return this.http.post<DataFlow>(`${this.baseUrl}/catalogos/data-flows`, body);
  }

  updateDataFlow(id: number, body: DataFlowRequest): Observable<DataFlow> {
    return this.http.put<DataFlow>(`${this.baseUrl}/catalogos/data-flows/${id}`, body);
  }

  deleteDataFlow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/catalogos/data-flows/${id}`);
  }
}
