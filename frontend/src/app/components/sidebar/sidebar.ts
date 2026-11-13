import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings'; 
import { AuthService } from '../../services/auth'; 
import { APP_MENU } from '../../config/app-menu.config'; 

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  currentUserRole: string = 'staff'; 
  settings: any = { company_name: '', logo_url: '', workspace_name: '', owner_name: '' };
  menuItems: any[] = APP_MENU;
  
  expandedMenus: Set<string> = new Set();

  constructor(private settingsService: SettingsService, private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) this.currentUserRole = user.role;

    this.settingsService.settings$.subscribe(data => {
      if (data) this.settings = data;
    });
    this.settingsService.getSettings().subscribe();
  }

  toggleMenu(item: any) {
    if (this.expandedMenus.has(item.label)) {
      this.expandedMenus.delete(item.label);
    } else {
      this.expandedMenus.add(item.label);
    }
  }

  get filteredMenuItems() {
    return this.menuItems.map(item => {
      if (item.allowedRoles && !item.allowedRoles.includes(this.currentUserRole)) return null;

      let hasParentAccess = !item.moduleKey || this.authService.hasModuleAccess(item.moduleKey);
      let allowedChildren: any[] = [];

      if (item.children) {
        allowedChildren = item.children.filter((child: any) => {
          if (child.allowedRoles && !child.allowedRoles.includes(this.currentUserRole)) return false;
          if (child.moduleKey && !this.authService.hasModuleAccess(child.moduleKey)) return false;
          return true;
        });

        if (allowedChildren.length > 0) hasParentAccess = true;
      }

      return hasParentAccess ? { ...item, children: allowedChildren } : null;
    }).filter(item => item !== null) as any[];
  }
  
}