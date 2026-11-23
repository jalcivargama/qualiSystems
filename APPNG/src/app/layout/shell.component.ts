import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../pages/login/auth.service';

interface NavigationItem {
  label: string;
  route: string;
}

interface NavigationGroup {
  label: string;
  icon: string;
  items: NavigationItem[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  openMenu: string | null = null;
  readonly appVersion = environment.version;
  readonly navigationGroups: NavigationGroup[] = [
    {
      label: 'Inicio',
      icon: '⌂',
      items: [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Explorar dependencias', route: '/explorador-dependencias' },
        { label: 'Búsqueda de componentes', route: '/busqueda-componentes' },
      ],
    },
    {
      label: 'Catálogos',
      icon: '▦',
      items: [
        { label: 'Tecnología', route: '/catalogos/technology' },
        { label: 'Tipos de dependencia', route: '/catalogos/dependency_type' },
        { label: 'Personas', route: '/catalogos/person' },
        { label: 'Roles de responsabilidad', route: '/catalogos/responsibility_role' },
      ],
    },
    {
      label: 'Componentes',
      icon: '▣',
      items: [
        { label: 'Componentes', route: '/catalogos/catalog_component' },
        { label: 'Sistemas', route: '/catalogos/system_detail' },
        { label: 'APIs', route: '/catalogos/api_detail' },
        { label: 'Bases de datos', route: '/catalogos/database_detail' },
        { label: 'Infraestructura', route: '/catalogos/infrastructure_detail' },
        { label: 'Stack tecnológico', route: '/catalogos/component_technology' },
      ],
    },
    {
      label: 'Dependencias',
      icon: '⌘',
      items: [
        { label: 'Dependencias', route: '/catalogos/dependency' },
        { label: 'Flujos de datos', route: '/catalogos/data_flow' },
        { label: 'Despliegues', route: '/catalogos/system_deployment' },
      ],
    },
  ];

  constructor(readonly auth: AuthService) {}

  toggleMenu(label: string): void {
    this.openMenu = this.openMenu === label ? null : label;
  }

  closeMenus(): void {
    this.openMenu = null;
  }
}
