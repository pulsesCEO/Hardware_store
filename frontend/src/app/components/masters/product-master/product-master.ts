import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MasterService } from '../../../services/master';
import { SettingsService } from '../../../services/settings'; 

@Component({
  selector: 'app-product-master',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './product-master.html',
  styleUrl: './product-master.css'
})
export class ProductMaster implements OnInit {
  products: any[] = [];
  isInventoryEnabled: boolean = true; // Default to true
  endpoint = 'products'; 
  searchTerm = '';
  currentPage: number = 1;
  pageSize: number = 5;

  constructor(private masterService: MasterService, private router: Router, private settingsService: SettingsService) {}

  ngOnInit() {
     this.loadData(); 
     this.checkModuleSettings();
     } 
     
    checkModuleSettings() {
    this.settingsService.getSettings().subscribe(settings => {
      const enabledModules = settings.enabled_modules || [];
      // If 'inventory' is in the enabled_modules array, this is true
      this.isInventoryEnabled = enabledModules.includes('inventory');
    });
  }

  loadData() {
    this.masterService.getAll<any>(this.endpoint).subscribe(data => {
      this.products = data;
      this.currentPage = 1;
    });
  }

  get filteredProducts() {
    if (!this.searchTerm) return this.products;
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term)
    );
  }

  get paginatedProducts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages() { return Math.ceil(this.filteredProducts.length / this.pageSize); }
  get pages() { return Array(this.totalPages).fill(0).map((x, i) => i + 1); }
  
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  setPage(page: number) { this.currentPage = page; }
  onSearch() { this.currentPage = 1; }

  // --- SUMMARY METRICS (This is what fixes your error) ---
  get totalProducts() { return this.products.length; }
  
  get totalStockValue() { 
    return this.products.reduce((sum, p) => sum + (Number(p.stock_level) * Number(p.cost_price)), 0); 
  }

  get lowStockCount() {
    return this.products.filter(p => Number(p.stock_level) <= Number(p.min_stock)).length;
  }

  // --- ACTIONS ---
  goToAdd() { this.router.navigate(['/masters/products/add']); }
  goToEdit(id: number) { this.router.navigate(['/masters/products/edit', id]); }

  deleteProduct(id: number) {
    if (confirm('Delete this product?')) {
      this.masterService.delete(this.endpoint, id).subscribe(() => this.loadData());
    }
  }
}