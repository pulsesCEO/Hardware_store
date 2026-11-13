import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MasterService } from '../../../services/master';
import { SettingsService } from '../../../services/settings';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
}) 
export class ProductForm implements OnInit {
    isInventoryEnabled: boolean = true;

  // 1. Added gst_id to the object
  product = { sku: '', name: '', unit_id: null, gst_id: null, cost_price: 0, selling_price: 0, stock_level: 0, min_stock: 5 };
  
  units: any[] = []; 
  gstList: any[] = []; // 2. Added array for GST rates
  endpoint = 'products';
  editingId: number | null = null;
  isSaving = false;
  message = '';
  isError = false;

  constructor(private masterService: MasterService, private router: Router, private route: ActivatedRoute,private settingsService: SettingsService) {}

  ngOnInit() {
    
       this.settingsService.getSettings().subscribe(settings => {
      const enabledModules = settings.enabled_modules || [];
      this.isInventoryEnabled = enabledModules.includes('inventory');
    });
    
  
    // Fetch Units for the dropdown
    this.masterService.getAll<any>('units').subscribe(data => this.units = data);
    
    // 3. Fetch GST List for the dropdown
    this.masterService.getAll<any>('gst').subscribe(data => this.gstList = data);

    // Check if editing
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editingId = Number(idParam);
      this.masterService.getAll<any>(this.endpoint).subscribe(data => {
        const found = data.find(p => p.id === this.editingId);
        if (found) {
          // 4. Map gst_id when editing
          this.product = { 
            sku: found.sku, 
            name: found.name, 
            unit_id: found.unit_id,
            gst_id: found.gst_id, 
            cost_price: Number(found.cost_price), 
            selling_price: Number(found.selling_price),
            stock_level: Number(found.stock_level), 
            min_stock: Number(found.min_stock)
          };
        }
      });
    }
  }

  saveProduct() {
    if (!this.product.name || !this.product.sku || !this.product.unit_id) {
      this.message = 'SKU, Name, and Unit are required'; 
      this.isError = true; 
      return;
    }
    this.isSaving = true;
    const req = this.editingId 
      ? this.masterService.update<any>(this.endpoint, this.editingId, this.product) 
      : this.masterService.create<any>(this.endpoint, this.product);
    
    req.subscribe({
      next: () => this.router.navigate(['/masters/products']),
      error: (err) => { 
        this.isSaving = false; 
        this.message = err.error?.error || 'Failed to save'; 
        this.isError = true; 
      }
    });
  }

  cancel() { this.router.navigate(['/masters/products']); }
}