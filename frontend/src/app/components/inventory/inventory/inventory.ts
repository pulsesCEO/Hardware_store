import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterService } from '../../../services/master'; 

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  products: any[] = [];
  searchTerm = '';

  // Removed Router from constructor
  constructor(private masterService: MasterService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    // Fetches directly from Product Master API
    this.masterService.getAll<any>('products').subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error loading inventory', err)
    });
  }

  // Search logic
  get filteredProducts() {
    if (!this.searchTerm) return this.products;
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term)
    );
  }
}