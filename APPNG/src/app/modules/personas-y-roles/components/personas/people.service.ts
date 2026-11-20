import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Person, PersonRequest } from './models/person.model';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getPeople(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}/catalogos/people`);
  }

  createPerson(body: PersonRequest): Observable<Person> {
    return this.http.post<Person>(`${this.baseUrl}/catalogos/people`, body);
  }

  updatePerson(id: number, body: PersonRequest): Observable<Person> {
    return this.http.put<Person>(`${this.baseUrl}/catalogos/people/${id}`, body);
  }

  deletePerson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/catalogos/people/${id}`);
  }
}
