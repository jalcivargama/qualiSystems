import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SystemResponsibility } from './models/system-responsibility.model';

@Injectable({ providedIn: 'root' })
export class SystemResponsibilitiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllSystemResponsibilities(): Observable<SystemResponsibility[]> {
    return this.http.get<SystemResponsibility[]>(
      `${this.baseUrl}/catalogos/system-responsibilities`,
    );
  }
}
