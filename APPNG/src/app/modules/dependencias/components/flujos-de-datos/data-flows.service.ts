import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DataFlow } from './models/data-flow.model';

@Injectable({ providedIn: 'root' })
export class DataFlowsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllDataFlows(): Observable<DataFlow[]> {
    return this.http.get<DataFlow[]>(`${this.baseUrl}/catalogos/data-flows`);
  }
}
