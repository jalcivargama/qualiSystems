import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CreateNewComponentDto } from './models/create.component.dto';
import { CreateComponentResponseDto } from './models/create.component.response.dto';

@Injectable({ providedIn: 'root' })
export class ComponentsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  createNewComponent(dto: CreateNewComponentDto): Observable<CreateComponentResponseDto> {
    return this.http.post<CreateComponentResponseDto>(`${this.baseUrl}/catalogos/componentes`, dto);
  }
}
