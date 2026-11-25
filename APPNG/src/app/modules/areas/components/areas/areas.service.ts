import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CatalogArea } from './models/catalog-area.model';

@Injectable({ providedIn: 'root' })
export class AreasService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllAreas(): Observable<CatalogArea[]> {
    return this.http.get<CatalogArea[]>(`${this.baseUrl}/catalogos/areas`);
  }

  getArea(areaName: string): Observable<CatalogArea> {
    return this.http.get<CatalogArea>(
      `${this.baseUrl}/catalogos/areas/${encodeURIComponent(areaName)}`,
    );
  }

  createArea(body: CatalogArea): Observable<CatalogArea> {
    return this.http.post<CatalogArea>(`${this.baseUrl}/catalogos/areas`, body);
  }

  updateArea(areaName: string, body: CatalogArea): Observable<CatalogArea> {
    return this.http.put<CatalogArea>(
      `${this.baseUrl}/catalogos/areas/${encodeURIComponent(areaName)}`,
      body,
    );
  }

  deleteArea(areaName: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/catalogos/areas/${encodeURIComponent(areaName)}`,
    );
  }
}
