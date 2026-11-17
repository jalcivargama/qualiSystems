import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogStoreService, MockRecord } from '../../core/catalog-store.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly systems: Array<MockRecord & { name: string; owner_area: string; criticality: string; system_status: string }>;
  readonly systemCount: number;
  readonly dependencyCount: number;
  readonly apiCount: number;
  readonly criticalCount: number;

  constructor(private readonly store: CatalogStoreService) {
    const components = this.store.getRecords('catalog_component');
    this.systems = this.store.getRecords('system_detail').map((detail) => {
      const component = components.find((row) => String(row['component_id']) === String(detail['component_id']));
      return {
        ...detail,
        name: String(component?.['name'] ?? 'Sistema sin nombre'),
        owner_area: String(detail['owner_area'] ?? '—'),
        criticality: String(detail['criticality'] ?? '—'),
        system_status: String(detail['system_status'] ?? '—'),
      };
    });
    this.systemCount = components.filter((item) => item['component_type'] === 'SYSTEM').length;
    this.dependencyCount = this.store.count('dependency');
    this.apiCount = components.filter((item) => item['component_type'] === 'API').length;
    this.criticalCount = this.store.getRecords('dependency').filter((item) => item['criticality'] === 'CRITICAL').length;
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  readable(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
