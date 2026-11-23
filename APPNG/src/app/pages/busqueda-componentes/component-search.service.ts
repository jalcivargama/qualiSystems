import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/response.type';
import {
  ComponentSearchCriteria,
  ComponentSearchResult,
} from './models/component-search.model';

@Injectable({ providedIn: 'root' })
export class ComponentSearchService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  search(criteria: ComponentSearchCriteria): Observable<ComponentSearchResult[]> {
    return this.http
      .post<ComponentSearchResult[] | ApiResponse<ComponentSearchResult[]>>(
        `${this.baseUrl}/catalogos/dependency-explorer/search`,
        criteria,
      )
      .pipe(
        map((response) => {
          const results =
            Array.isArray(response)
              ? response
              : response.body;

          if (!Array.isArray(results)) {
            throw new Error(
              !Array.isArray(response) && response.msg
                ? response.msg
                : 'El endpoint de búsqueda no devolvió una lista.',
            );
          }

          return results;
        }),
      );
  }
}
