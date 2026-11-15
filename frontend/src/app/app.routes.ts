import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { AccessDenied } from './components/access-denied/access-denied';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Overview } from './components/overview/overview/overview';
import { SalesBilling } from './components/sales-billing/sales-billing/sales-billing';
import { Inventory } from './components/inventory/inventory/inventory';
import { Purchases } from './components/purchases/purchases/purchases';
import { Customers } from './components/customers/customers/customers';
import { Suppliers } from './components/suppliers/suppliers/suppliers';
import { Ledgers } from './components/ledgers/ledgers/ledgers';
import { Settings } from './components/settings/settings';
import { UnitMaster } from './components/masters/unit-master/unit-master';
import { CustomerMaster } from './components/masters/customer-master/customer-master';
import { CustomerForm } from './components/masters/customer-form/customer-form';
import { SupplierMaster } from './components/masters/supplier-master/supplier-master';
import { SupplierForm } from './components/masters/supplier-form/supplier-form';
import { ProductMaster } from './components/masters/product-master/product-master';
import { ProductForm } from './components/masters/product-form/product-form';
import { GstMaster } from './components/masters/gst-master/gst-master';
import { BankMaster } from './components/masters/bank-master/bank-master';
import { UserMaster } from './components/masters/user-master/user-master';
import { PigmyMachine } from './components/pigmy-machine/pigmy-machine/pigmy-machine';
import { ExportData } from './components/pigmy-machine/export-data/export-data';
import { ImportData } from './components/pigmy-machine/import-data/import-data';
import { Statement } from './components/statements/statement/statement';

export const routes: Routes = [
  // 1. PUBLIC ROUTE (No Guard)
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
  
  // 2. PROTECTED ROUTES (With moduleKey)
  { path: 'dashboard', component: Overview, canActivate: [AuthGuard], data: { moduleKey: 'dashboard' } },
  { path: 'sales', component: SalesBilling, canActivate: [AuthGuard], data: { moduleKey: 'sales' } },
  { path: 'inventory', component: Inventory, canActivate: [AuthGuard], data: { moduleKey: 'inventory' } },
  { path: 'purchases', component: Purchases, canActivate: [AuthGuard], data: { moduleKey: 'purchases' } },
  { path: 'customers', component: Customers, canActivate: [AuthGuard], data: { moduleKey: 'customers' } },
  { path: 'suppliers', component: Suppliers, canActivate: [AuthGuard], data: { moduleKey: 'suppliers' } },
  { path: 'ledgers', component: Ledgers, canActivate: [AuthGuard], data: { moduleKey: 'ledgers' } },

  // 3. RESTRICTED ROUTES (With moduleKey)
  { 
    path: 'settings', 
    component: Settings, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin'], moduleKey: 'settings' } 
  },
  
  // MASTERS ROUTES
  { 
    path: 'masters/units', 
    component: UnitMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_units' } 
  },
  { 
    path: 'masters/customers', 
    component: CustomerMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_customers' } 
  },
  { 
    path: 'masters/customers/add', 
    component: CustomerForm, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_customers' } 
  },
  { 
    path: 'masters/customers/edit/:id', 
    component: CustomerForm, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_customers' } 
  },
  { 
    path: 'masters/suppliers', 
    component: SupplierMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_suppliers' } 
  },
  { 
    path: 'masters/suppliers/add', 
    component: SupplierForm, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_suppliers' } 
  },
  { 
    path: 'masters/suppliers/edit/:id', 
    component: SupplierForm, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_suppliers' } 
  },
  { 
    path: 'masters/products', 
    component: ProductMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_products' } 
  },
  { 
    path: 'masters/products/add', 
    component: ProductForm, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_products' } 
  },
  { 
    path: 'masters/products/edit/:id', 
    component: ProductForm, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_products' } 
  },
  { 
    path: 'masters/gst', 
    component: GstMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_gst' } 
  },
  { 
    path: 'masters/banks', 
    component: BankMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_banks' } 
  },
  { 
    path: 'masters/users', 
    component: UserMaster, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin','staff'], moduleKey: 'masters_users' } 
  },


  { 
    path: 'pigmy-machine', 
    component: PigmyMachine, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin'] } 
  },
  { 
    path: 'pigmy-machine/export', 
    component: ExportData, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin'] } 
  },
  { 
    path: 'pigmy-machine/import', 
    component: ImportData, 
    canActivate: [AuthGuard], 
    data: { roles: ['super_admin', 'admin'] } 
  },
{ path: 'statements', component: Statement, canActivate: [AuthGuard] },






  // 4. ACCESS DENIED PAGE
  { path: 'access-denied', component: AccessDenied, canActivate: [AuthGuard] },
  
  // Wildcard
  { path: '**', redirectTo: 'dashboard' }
];