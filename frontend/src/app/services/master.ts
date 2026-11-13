import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth'; // Import AuthService

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  private baseUrl = 'http://localhost:5000/api/masters';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getAll<T>(endpoint: string): Observable<T[]> {
    const user = this.authService.getUser();
    let params = new HttpParams();

    // Automatically attach user_id and role to GET requests
    if (user) {
      params = params.set('user_id', user.id);
      params = params.set('role', user.role);
    }

    return this.http.get<T[]>(`${this.baseUrl}/${endpoint}`, { params });
  }

  create<T>(endpoint: string, data: any): Observable<T> {
    const user = this.authService.getUser();
    
    // Automatically attach created_by to POST requests
    const payload = {
      ...data,
      created_by: user ? user.id : null
    };

    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, payload);
  }

  // Keep your update and delete functions the same
  update<T>(endpoint: string, id: number, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}/${id}`, data);
  }

  delete(endpoint: string, id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${endpoint}/${id}`);
  }
}