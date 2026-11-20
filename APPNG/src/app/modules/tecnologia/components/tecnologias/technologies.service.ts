import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Technology, TechnologyRequest } from './models/technology.model';

@Injectable({ providedIn: 'root' })
export class TechnologiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllTechnologies(): Observable<Technology[]> {
    return this.http.get<Technology[]>(`${this.baseUrl}/catalogos/technologies`);
  }

  createTechnology(body: TechnologyRequest): Observable<Technology> {
    return this.http.post<Technology>(`${this.baseUrl}/catalogos/technologies`, body);
  }
}
