import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MasterService } from '../../../services/master';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './statement.html',
  styleUrl: './statement.css'
})
export class Statement implements OnInit {
  currentTab: string = 'debtors'; // 'debtors' or 'creditors'
  
  customers: any[] = [];
  suppliers: any[] = [];
  selectedId: number | null = null;
  selectedName: string = '';
  
  fromDate: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  toDate: string = new Date().toISOString().split('T')[0];

  statementData: any = { totalDebit: 0, totalCredit: 0, grandTotal: 0, transactions: [] };

  constructor(
    private http: HttpClient, 
    private masterService: MasterService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // 1. Fetch Customers and Suppliers for the dropdowns
    this.masterService.getAll<any>('customers').subscribe(data => this.customers = data);
    this.masterService.getAll<any>('suppliers').subscribe(data => this.suppliers = data);

    // 2. Listen for the ID passed from the button click
    this.route.queryParams.subscribe(params => {
      const type = params['type'];
      const id = params['id'];

      if (type && id) {
        this.currentTab = type;
        this.selectedId = Number(id);
        
        // Slight delay to ensure dropdown data is loaded before we try to select
        setTimeout(() => {
          this.loadStatement();
        }, 500); 
      }
    });
  }

  switchTab(tab: string) {
    this.currentTab = tab;
    this.selectedId = null;
    this.statementData = { totalDebit: 0, totalCredit: 0, grandTotal: 0, transactions: [] };
  }

  loadStatement() {
    if (!this.selectedId) return;

    const list = this.currentTab === 'debtors' ? this.customers : this.suppliers;
    const selected = list.find(c => c.id === this.selectedId);
    this.selectedName = selected ? (this.currentTab === 'debtors' ? selected.name : selected.company_name) : '';

    const endpoint = this.currentTab === 'debtors' 
      ? `http://localhost:5000/api/statements/customer/${this.selectedId}`
      : `http://localhost:5000/api/statements/supplier/${this.selectedId}`;

    this.http.get<any>(`${endpoint}?from=${this.fromDate}&to=${this.toDate}`)
      .subscribe({
        next: (res) => this.statementData = res,
        error: (err) => console.error('Failed to load statement', err)
      });
  }

  printStatement() {
    window.print();
  }
}