import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Points to our new /api/inventory route
  private apiUrl = 'http://localhost:5000/api/inventory';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getInventory(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  addInventoryItem(item: any): Observable<any> {
    return this.http.post(this.apiUrl, item, { headers: this.getAuthHeaders() });
  }
}