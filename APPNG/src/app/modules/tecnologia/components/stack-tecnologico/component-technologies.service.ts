import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ComponentTechnology } from './models/component-technology.model';

@Injectable({ providedIn: 'root' })
export class ComponentTechnologiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllComponentTechnologies(): Observable<ComponentTechnology[]> {
    return this.http.get<ComponentTechnology[]>(`${this.baseUrl}/catalogos/component-technologies`);
  }
}
