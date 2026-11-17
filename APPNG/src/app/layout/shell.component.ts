import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CatalogDefinition, CatalogStoreService } from '../core/catalog-store.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
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
