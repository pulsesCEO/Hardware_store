import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // 👈 Import HttpHeaders
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) { }

  // 👇 Helper method to generate headers with the token
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // 👇 Update these to send the headers
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, { headers: this.getAuthHeaders() });
  }

  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, { headers: this.getAuthHeaders() });
  } 

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  } 

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user && user.role === role;
  }

  hasModuleAccess(moduleKey: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === 'super_admin') return true; 
    return user.enabled_modules && user.enabled_modules.includes(moduleKey);
  } 


  // Add inside AuthService class
updateUser(id: number, userData: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/users/${id}`, userData, { headers: this.getAuthHeaders() });
}

deleteUser(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/users/${id}`, { headers: this.getAuthHeaders() });
}
  // Add this function to update the modules for a specific user
  updateUserModules(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/modules`, payload, { headers: this.getAuthHeaders() });
  }
}
