import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  addProduct(product: any): Observable<any> {
    return this.http.post(this.apiUrl, product, { headers: this.getAuthHeaders() });
  }
}