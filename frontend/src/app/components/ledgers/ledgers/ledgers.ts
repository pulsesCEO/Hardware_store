import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth'; // <-- Import



@Component({
  selector: 'app-ledgers',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './ledgers.html',
  styleUrl: './ledgers.css'
})
export class Ledgers implements OnInit {
  debtors: any[] = [];
  creditors: any[] = [];
  daybook: any[] = [];

  // NEW: Filters for General Ledger
  filterFromDate: string = '';
  filterToDate: string = '';
  filterSearch: string = '';

  // Modal State (Payment)
  isModalOpen = false;
  modalType: 'collect' | 'pay' = 'collect';
  selectedEntity: any = null;
  paymentAmount: number = 0;
  message = '';
  isError = false;

  // Modal State (View All)
  isViewAllDebtorsOpen = false;
  isViewAllCreditorsOpen = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadData();
  }

  // UPDATED: to include filter parameters
  // loadData() {
  //   let url = 'http://localhost:5000/api/ledgers?';
  //   if (this.filterFromDate) url += `from=${this.filterFromDate}&`;
  //   if (this.filterToDate) url += `to=${this.filterToDate}&`;
  //   if (this.filterSearch) url += `search=${this.filterSearch}&`;

  //   this.http.get<any>(url).subscribe({
  //     next: (data) => {
  //       this.debtors = data.debtors.sort((a: any, b: any) => b.id - a.id);
  //       this.creditors = data.creditors.sort((a: any, b: any) => b.id - a.id);
  //       this.daybook = data.daybook;
  //     },
  //     error: (err) => this.showMessage('Failed to load ledger data', true)
  //   });
  // }
  loadData() {
    const user = this.authService.getUser();
    
    let url = 'http://localhost:5000/api/ledgers?';
    if (this.filterFromDate) url += `from=${this.filterFromDate}&`;
    if (this.filterToDate) url += `to=${this.filterToDate}&`;
    if (this.filterSearch) url += `search=${this.filterSearch}&`;
    
    // Attach user_id and role so the backend can filter
    if (user) {
      url += `user_id=${user.id}&role=${user.role}`;
    }

    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.debtors = data.debtors.sort((a: any, b: any) => b.id - a.id);
        this.creditors = data.creditors.sort((a: any, b: any) => b.id - a.id);
        this.daybook = data.daybook;
      },
      error: (err) => this.showMessage('Failed to load ledger data', true)
    });
  }


  // NEW: Clear filters function
  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterSearch = '';
    this.loadData();
  }

  // --- Navigation to Statement ---
  viewStatement(id: number, type: 'debtors' | 'creditors') {
    this.router.navigate(['/statements'], { queryParams: { type: type, id: id } });
  }

  // --- Payment Modal Logic ---
  openModal(type: 'collect' | 'pay', entity: any) {
    this.modalType = type;
    this.selectedEntity = entity;
    this.paymentAmount = type === 'collect' ? entity.outstanding_balance : entity.outstanding_balance;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedEntity = null;
  }

  submitPayment() {
    if (this.paymentAmount <= 0) return;

      const user = this.authService.getUser(); 
    const url = this.modalType === 'collect' 
      ? 'http://localhost:5000/api/ledgers/collect-payment'
      : 'http://localhost:5000/api/ledgers/pay-supplier';

       // 👇 ADD `user_id: user?.id` HERE 👇
    const payload = this.modalType === 'collect'
      ? { customer_id: this.selectedEntity.id, amount: this.paymentAmount, user_id: user?.id }
      : { supplier_id: this.selectedEntity.id, amount: this.paymentAmount, user_id: user?.id };


    // const payload = this.modalType === 'collect'
    //   ? { customer_id: this.selectedEntity.id, amount: this.paymentAmount }
    //   : { supplier_id: this.selectedEntity.id, amount: this.paymentAmount };

    this.http.post(url, payload).subscribe({
      next: (res: any) => {
        this.closeModal();
        this.showMessage(res.message, false);
        this.loadData(); // Refresh data
      },
      error: (err) => {
        this.showMessage(err.error?.error || 'Transaction failed', true);
      }
    });
  }

  // --- View All Modals Logic ---
  openViewAll(type: 'debtors' | 'creditors') {
    if (type === 'debtors') this.isViewAllDebtorsOpen = true;
    else this.isViewAllCreditorsOpen = true;
  }

  closeViewAll() {
    this.isViewAllDebtorsOpen = false;
    this.isViewAllCreditorsOpen = false;
  }

  // --- Helpers ---
  getTotalDebtors() {
    return this.debtors.reduce((sum, c) => sum + Number(c.outstanding_balance), 0);
  }

  getTotalCreditors() {
    return this.creditors.reduce((sum, c) => sum + Number(c.outstanding_balance), 0);
  }

  showMessage(msg: string, isErr: boolean) {
    this.message = msg;
    this.isError = isErr;
    setTimeout(() => this.message = '', 4000);
  } 
}