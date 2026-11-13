import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MasterService } from '../../../services/master'; 

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css'
})
export class Purchases implements OnInit {
  activeTab: string = 'add'; // 'add' or 'list'

  // Data from database
  suppliers: any[] = [];
  products: any[] = [];
  purchases: any[] = [];

  // Form State
  selectedSupplierId: number | null = null;
  selectedProductId: number | null = null;
  quantity: number = 1;
  costPrice: number = 0;
  cart: any[] = [];
  isCreditPurchase: boolean = false;

  // Totals
  subTotal: number = 0;
  taxTotal: number = 0;
  grandTotal: number = 0;

  // UI State
  isSaving = false;
  message = '';
  isError = false;

  constructor(private masterService: MasterService, private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Fetch Suppliers
    this.masterService.getAll<any>('suppliers').subscribe(data => this.suppliers = data);
    
    // Fetch Products
    this.masterService.getAll<any>('products').subscribe(data => this.products = data);

    // Fetch Purchase History
    this.loadPurchases();
  }

  loadPurchases() {
    this.http.get<any[]>('http://localhost:5000/api/purchases').subscribe({
      next: (data) => this.purchases = data,
      error: (err) => console.error('Failed to load purchases', err)
    });
  }

  // When a product is selected, auto-fill its cost price
  onProductSelect() {
    if (!this.selectedProductId) return;
    const product = this.products.find(p => p.id === this.selectedProductId);
    if (product) {
      this.costPrice = Number(product.cost_price);
    }
  }

  addItem() {
    if (!this.selectedProductId || this.quantity <= 0) return;
    
    const product = this.products.find(p => p.id === this.selectedProductId);
    if (!product) return;

    const existingItem = this.cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      existingItem.quantity += this.quantity;
      existingItem.total_price = existingItem.quantity * existingItem.cost_price;
    } else {
      this.cart.push({
        product_id: product.id,
        name: product.name,
        unit: product.unit?.short_name || '',
        quantity: this.quantity,
        cost_price: this.costPrice,
        gst_rate: product.gst ? Number(product.gst.tax_rate) : 0,
        total_price: this.quantity * this.costPrice
      });
    }

    // Reset inputs
    this.selectedProductId = null;
    this.quantity = 1;
    this.costPrice = 0;
    this.calculateTotals();
  }

  removeItem(index: number) {
    this.cart.splice(index, 1);
    this.calculateTotals();
  }

  calculateTotals() {
    this.subTotal = 0;
    this.taxTotal = 0;

    this.cart.forEach(item => {
      const lineTotal = item.cost_price * item.quantity;
      const lineTax = lineTotal * (item.gst_rate / 100);
      this.subTotal += lineTotal;
      this.taxTotal += lineTax;
    });

    this.grandTotal = this.subTotal + this.taxTotal;
  }

  savePurchase() {
    if (!this.selectedSupplierId || this.cart.length === 0) {
      this.showMessage('Please select a supplier and add at least one item.', true);
      return;
    }

    this.isSaving = true;
    const payload = {
      supplier_id: this.selectedSupplierId,
      items: this.cart,
      sub_total: this.subTotal,
      tax_amount: this.taxTotal,
      total_amount: this.grandTotal,
      payment_mode: this.isCreditPurchase ? 'Supplier Credit' : 'Cash'
    };

    this.http.post('http://localhost:5000/api/purchases', payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.showMessage(`Purchase ${res.purchase_no} saved successfully!`, false);
        this.resetForm();
        this.loadPurchases(); // Refresh history
        this.loadData(); // Refresh product stock levels
        this.activeTab = 'list'; // Switch to history tab automatically
      },
      error: (err) => {
        this.isSaving = false;
        this.showMessage(err.error?.error || 'Failed to save purchase', true);
      }
    });
  }

  resetForm() {
    this.selectedSupplierId = null;
    this.cart = [];
    this.isCreditPurchase = false;
    this.calculateTotals();
  }

  showMessage(msg: string, isErr: boolean) {
    this.message = msg;
    this.isError = isErr;
    setTimeout(() => this.message = '', 4000);
  }
}