import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SystemDetail } from './models/system-detail.model';

@Injectable({ providedIn: 'root' })
export class SystemDetailsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllSystemDetails(): Observable<SystemDetail[]> {
    return this.http.get<SystemDetail[]>(`${this.baseUrl}/catalogos/system-details`);
  }
}
