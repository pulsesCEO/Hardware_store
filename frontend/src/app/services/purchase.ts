import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private apiUrl = 'http://localhost:5000/api/purchases';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  createPurchase(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, { headers: this.getAuthHeaders() });
  } 
    getPurchases(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }
}