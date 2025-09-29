export interface AppNavItem {
  label: string;
  icon?: string;
  routerLink?: any[] | string;
  exact?: boolean;
}
export interface AppNavSection {
  label: string;
  items: AppNavItem[];
}
