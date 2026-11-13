import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

  // Modal State
  isModalOpen = false;
  modalType: 'collect' | 'pay' = 'collect';
  selectedEntity: any = null;
  paymentAmount: number = 0;
  message = '';
  isError = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any>('http://localhost:5000/api/ledgers').subscribe({
      next: (data) => {
        this.debtors = data.debtors;
        this.creditors = data.creditors;
        this.daybook = data.daybook;
      },
      error: (err) => this.showMessage('Failed to load ledger data', true)
    });
  }

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

    const url = this.modalType === 'collect' 
      ? 'http://localhost:5000/api/ledgers/collect-payment'
      : 'http://localhost:5000/api/ledgers/pay-supplier';

    const payload = this.modalType === 'collect'
      ? { customer_id: this.selectedEntity.id, amount: this.paymentAmount }
      : { supplier_id: this.selectedEntity.id, amount: this.paymentAmount };

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

  showMessage(msg: string, isErr: boolean) {
    this.message = msg;
    this.isError = isErr;
    setTimeout(() => this.message = '', 4000);
  } 
    getTotalDebtors() {
    return this.debtors.reduce((sum, c) => sum + Number(c.outstanding_balance), 0);
  }

  getTotalCreditors() {
    return this.creditors.reduce((sum, c) => sum + Number(c.outstanding_balance), 0);
  }
}