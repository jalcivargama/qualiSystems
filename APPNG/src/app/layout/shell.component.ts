import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CatalogDefinition, CatalogStoreService } from '../core/catalog-store.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" routerLink="/dashboard" aria-label="Qualitas Systems, inicio">
          <img class="brand-mark" src="assets/ImgQualitasVertical_Transparente.png" alt="" />
          <span>Qualitas<span class="brand-light">/</span>systems</span>
        </a>
        <nav class="main-nav" aria-label="Navegación principal">
          <div class="home-nav">
            <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenus()">
              <span class="nav-icon">⌂</span> Inicio
            </a>
            <button class="home-menu-trigger" type="button" aria-label="Abrir opciones de inicio"
              [attr.aria-expanded]="homeOpen" (click)="homeOpen = !homeOpen; catalogOpen = false">⌄</button>
            @if (homeOpen) {
              <div class="home-dropdown">
                <a routerLink="/dashboard" (click)="closeMenus()"><span>▦</span> Dashboard</a>
                <a routerLink="/explorador-dependencias" routerLinkActive="selected" (click)="closeMenus()">
                  <span>⌘</span> Explorar dependencias
                </a>
              </div>
            }
          </div>
          <div class="catalog-nav">
            <button class="nav-menu-trigger" [class.active]="catalogOpen" (click)="catalogOpen = !catalogOpen; homeOpen = false" [attr.aria-expanded]="catalogOpen">
              <span class="nav-icon">▦</span> Catálogos <span class="chevron">⌄</span>
            </button>
            @if (catalogOpen) {
              <div class="catalog-dropdown">
                <div class="dropdown-heading">
                  <div><span class="eyebrow">ADMINISTRACIÓN</span><strong>Catálogos</strong></div>
                  <button class="close-menu" aria-label="Cerrar menú" (click)="catalogOpen = false">×</button>
                </div>
                <div class="dropdown-groups">
                  @for (group of menuGroups; track group.name) {
                    <section>
                      <h3>{{ group.name }}</h3>
                      @for (item of group.items; track item.table) {
                        <a [routerLink]="['/catalogos', item.table]" routerLinkActive="selected" (click)="catalogOpen = false">
                          <span class="menu-dot"></span>{{ item.title }}<span class="menu-arrow">↗</span>
                        </a>
                      }
                    </section>
                  }
                </div>
                <div class="dropdown-foot">14 catálogos · Datos de demostración</div>
              </div>
            }
          </div>
          <a class="nav-muted" routerLink="/catalogos/dependency" (click)="closeMenus()">
            <span class="nav-icon">⌘</span> Dependencias
          </a>
        </nav>
        <div class="topbar-right">
          <span class="environment"><span></span> DEMO</span>
          <div class="user-menu">
            <div class="avatar">AD</div>
            <div class="user-copy"><strong>{{ auth.displayName }}</strong><span>Administrador</span></div>
            <button class="signout-button" aria-label="Cerrar sesión" title="Cerrar sesión" (click)="auth.signOut()">↪</button>
          </div>
        </div>
      </header>
      <main class="main-content">
        <router-outlet />
      </main>
      <footer class="app-footer">
        <span>© 2026 Qualitas Systems</span><span>Catálogo de arquitectura · Prototipo navegable</span>
      </footer>
    </div>
  `,
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  catalogOpen = false;
  homeOpen = false;
  readonly menuGroups: Array<{ name: string; items: CatalogDefinition[] }> = [];

  constructor(readonly auth: AuthService, private readonly store: CatalogStoreService) {
    this.menuGroups = ['Catálogo principal', 'Operación', 'Personas y roles', 'Tecnología', 'Dependencias'].map((name) => ({
      name,
      items: this.store.definitions.filter((definition) => definition.group === name),
    }));
  }

  closeMenus(): void {
    this.homeOpen = false;
    this.catalogOpen = false;
  }
}
