import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AstroService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getPrediction(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/predict`, userData);
  }

  getRecords(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/records`);
  }
}
