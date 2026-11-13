import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings'; 
import { AuthService } from '../../services/auth'; 
import { APP_MENU } from '../../config/app-menu.config';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  activeTab: string = 'store';
  isUploading = false;
  
  // Admin Management
  adminList: any[] = [];
  newAdmin: any = { name: '', email: '', password: '' };
  selectedAdmin: any = null; 
  adminModules: string[] = [];

  // Store Settings
  settingsData: any = {
    company_name: '',
    logo_url: '',
    workspace_name: '',
    owner_name: '',
    enabled_modules: [] 
  };
  
  // User Permissions
  userPermissions: any = {
    email: '',
    enabled_modules: []
  };

  editingAdmin: any = null;
editAdminData: any = { name: '', email: '', password: '' };
  isSaving = false;
  message = '';

  // 👇 1. allModules is needed for "TAB 2: MODULES"
  allModules: { key: string, label: string }[] = [];
  
  // 👇 2. permissionMenu is needed for "TAB 5" and "Admin Modal"
  permissionMenu: any[] = [];

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Generate both lists from the main config
    this.generateLists();

    // Load settings
    this.settingsService.getSettings().subscribe({
      next: (data: any) => {
        this.settingsData = data;
        if (!this.settingsData.enabled_modules) {
          this.settingsData.enabled_modules = [];
        }
      },
      error: (err: any) => console.error('Error fetching settings:', err)
    });

    // Load admins
    this.loadAdmins();
  }

  // 🔥 This function creates the flat list AND the nested list
  generateLists() {
    // 1. Create nested list for User Access & Admins (filters out 'settings')
    this.permissionMenu = APP_MENU.filter(m => m.moduleKey !== 'settings');

    // 2. Create flat list for TAB 2 (Global Store Modules)
    const flatList: any[] = [];
    APP_MENU.forEach(item => {
      if (item.moduleKey) {
        flatList.push({ key: item.moduleKey, label: item.label });
      }
      if (item.children) {
        item.children.forEach((child: any) => {
          if (child.moduleKey) {
            flatList.push({ key: child.moduleKey, label: `↳ ${child.label}` });
          }
        });
      }
    });
    this.allModules = flatList;
  }

  setTab(tab: string) {
    this.activeTab = tab;
  } 

  // --- TAB 2: STORE SETTINGS LOGIC ---
  toggleModule(key: string) {
    const index = this.settingsData.enabled_modules.indexOf(key);
    if (index > -1) {
      this.settingsData.enabled_modules.splice(index, 1);
    } else {
      this.settingsData.enabled_modules.push(key);
    }
  }

  isModuleEnabled(key: string): boolean {
    return this.settingsData.enabled_modules.includes(key);
  }

  saveSettings() {
    this.isSaving = true;
    this.message = '';
    
    this.settingsService.updateSettings(this.settingsData).subscribe({
      next: (data: any) => {
        this.isSaving = false;
        this.message = 'Settings saved to database successfully!';
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.message = 'Failed to save settings.';
        console.error(err);
      }
    });
  } 

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.isUploading = true;
      this.settingsService.uploadLogo(file).subscribe({
        next: (response: any) => {
          this.settingsData.logo_url = response.logo_url;
          this.saveSettings(); 
          this.isUploading = false;
        },
        error: (err: any) => {
          console.error('Upload failed:', err);
          this.isUploading = false;
          this.message = 'Failed to upload image.';
        }
      });
    }
  }   

  // --- TAB 5: USER ACCESS LOGIC ---
  toggleUserModule(item: any) {
    const key = item.moduleKey;
    const index = this.userPermissions.enabled_modules.indexOf(key);

    if (index > -1) {
      this.userPermissions.enabled_modules.splice(index, 1);
      // Uncheck children
      if (item.children) {
        item.children.forEach((child: any) => {
          const childIdx = this.userPermissions.enabled_modules.indexOf(child.moduleKey);
          if (childIdx > -1) this.userPermissions.enabled_modules.splice(childIdx, 1);
        });
      }
    } else {
      this.userPermissions.enabled_modules.push(key);
      // Auto-check children
      if (item.children) {
        item.children.forEach((child: any) => {
          if (!this.userPermissions.enabled_modules.includes(child.moduleKey)) {
            this.userPermissions.enabled_modules.push(child.moduleKey);
          }
        });
      }
    }
  }

  toggleUserChildModule(childKey: string) {
    const index = this.userPermissions.enabled_modules.indexOf(childKey);
    if (index > -1) {
      this.userPermissions.enabled_modules.splice(index, 1);
    } else {
      this.userPermissions.enabled_modules.push(childKey);
    }
  }

  saveUserPermissions() {
    this.settingsService.saveUserPermissions(this.userPermissions).subscribe({
      next: (res: any) => {
        this.message = 'User access updated successfully!';
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.message = 'Failed to update user access.';
        console.error(err);
      }
    });
  }

  // --- ADMIN MANAGEMENT LOGIC ---
  loadAdmins() {
    this.authService.getUsers().subscribe((users: any[]) => {
        this.adminList = users.filter((u: any) => u.role === 'admin');
    });
  }

  createAdmin() {
    const adminData = { ...this.newAdmin, role: 'admin' };
    this.authService.registerUser(adminData).subscribe({
      next: (res: any) => {
        this.message = 'Admin created successfully!';
        this.newAdmin = { name: '', email: '', password: '' };
        this.loadAdmins();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.message = 'Failed to create admin. ' + (err.error?.error || '');
        setTimeout(() => this.message = '', 3000);
      }
    });
  }

  openAdminModuleModal(admin: any) {
    this.selectedAdmin = admin;
    this.adminModules = admin.enabled_modules ? [...admin.enabled_modules] : [];
  }

  toggleAdminModule(item: any) {
    const key = item.moduleKey;
    const index = this.adminModules.indexOf(key);

    if (index > -1) {
      this.adminModules.splice(index, 1);
      if (item.children) {
        item.children.forEach((child: any) => {
          const childIdx = this.adminModules.indexOf(child.moduleKey);
          if (childIdx > -1) this.adminModules.splice(childIdx, 1);
        });
      }
    } else {
      this.adminModules.push(key);
      if (item.children) {
        item.children.forEach((child: any) => {
          if (!this.adminModules.includes(child.moduleKey)) {
            this.adminModules.push(child.moduleKey);
          }
        });
      }
    }
  }

  toggleAdminChildModule(childKey: string) {
    const idx = this.adminModules.indexOf(childKey);
    if (idx > -1) this.adminModules.splice(idx, 1);
    else this.adminModules.push(childKey);
  }

  // saveAdminModules() {
  //   const payload = { email: this.selectedAdmin.email, enabled_modules: this.adminModules };
  //   this.settingsService.saveUserPermissions(payload).subscribe({
  //     next: (res: any) => {
  //       this.message = 'Admin access updated!';
  //       this.selectedAdmin = null;
  //       this.loadAdmins();
  //       setTimeout(() => this.message = '', 3000);
  //     },
  //     error: (err: any) => {
  //       this.message = 'Failed to update admin access.';
  //       setTimeout(() => this.message = '', 3000);
  //     }
  //   });
  // } 


    saveAdminModules() {
    // Create the payload with enabled_modules
    const payload = { enabled_modules: this.adminModules };
    
    // Call the API to update this specific user by ID
    this.authService.updateUserModules(this.selectedAdmin.id, payload).subscribe({
      next: (res: any) => {
        this.message = 'Admin access updated!';
        this.selectedAdmin = null;
        this.loadAdmins();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.message = 'Failed to update admin access.';
        setTimeout(() => this.message = '', 3000);
      }
    });
  } 
openEditAdminModal(admin: any) {
  this.editingAdmin = admin;
  this.editAdminData = { name: admin.name, email: admin.email, password: '' };
}

saveEditedAdmin() {
  this.authService.updateUser(this.editingAdmin.id, this.editAdminData).subscribe({
    next: (res: any) => {
      this.message = 'Admin updated successfully!';
      this.editingAdmin = null;
      this.loadAdmins(); // Refresh the table
      setTimeout(() => this.message = '', 3000);
    },
    error: (err: any) => {
      this.message = 'Failed to update admin. ' + (err.error?.error || '');
    }
  });
}

deleteAdmin(admin: any) {
  // Ask for confirmation before deleting
  if (confirm(`Are you sure you want to delete ${admin.name}? This cannot be undone.`)) {
    this.authService.deleteUser(admin.id).subscribe({
      next: (res: any) => {
        this.message = 'Admin deleted successfully!';
        this.loadAdmins();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.message = 'Failed to delete admin.';
      }
    });
  }
}


}
