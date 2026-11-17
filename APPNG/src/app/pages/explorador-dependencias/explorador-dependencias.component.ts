import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ComponentCardDetails,
  DependencyExplorerService,
  DependencyTreeNode,
} from '../../core/dependency-explorer.service';
import { MockRecord } from '../../core/catalog-store.service';

@Component({
  selector: 'app-explorador-dependencias',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './explorador-dependencias.component.html',
  styleUrl: './explorador-dependencias.component.css',
})
export class ExploradorDependenciasComponent {
  readonly components: MockRecord[];
  selectedId = '';
  root: DependencyTreeNode | null = null;
  private readonly detailCache = new Map<string, ComponentCardDetails>();

  constructor(readonly explorer: DependencyExplorerService) {
    this.components = explorer.components;
  }

  String(value: unknown): string {
    return String(value ?? '');
  }

  selectComponent(id: string): void {
    const component = this.components.find((item) => String(item['component_id']) === id);
    this.detailCache.clear();
    this.root = component ? this.explorer.createRoot(component) : null;
  }

  toggle(node: DependencyTreeNode): void {
    this.explorer.toggle(node);
  }

  detailsFor(component: MockRecord): ComponentCardDetails {
    const id = String(component['component_id']);
    const cached = this.detailCache.get(id);
    if (cached) return cached;
    const details = this.explorer.details(component);
    this.detailCache.set(id, details);
    return details;
  }

  initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
  }

  readable(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
