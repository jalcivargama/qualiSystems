import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CatalogComponent } from './pages/catalog.component';
import { DashboardComponent } from './pages/dashboard.component';
import { ExploradorDependenciasComponent } from './pages/explorador-dependencias.component';
import { LoginComponent } from './pages/login.component';
import { ShellComponent } from './layout/shell.component';

const requireSession = () => {
  const auth = inject(AuthService);
  if (auth.hasSession()) return true;
  return inject(Router).createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [requireSession],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'explorador-dependencias', component: ExploradorDependenciasComponent },
      { path: 'catalogos/:table', component: CatalogComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
