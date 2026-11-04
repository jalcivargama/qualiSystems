import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ComponentCardDetails,
  DependencyExplorerService,
  DependencyTreeNode,
} from '../core/dependency-explorer.service';
import { MockRecord } from '../core/catalog-store.service';

@Component({
  selector: 'app-explorador-dependencias',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="explorer-heading">
      <div>
        <div class="explorer-breadcrumbs"><a routerLink="/dashboard">Inicio</a><span>/</span><strong>Explorar dependencias</strong></div>
        <span class="explorer-eyebrow">ARQUITECTURA CONECTADA</span>
        <h1>Explorador de dependencias</h1>
        <p>Selecciona un componente y navega su árbol de dependencias salientes.</p>
      </div>
      <div class="demo-badge"><i></i> Datos de demostración</div>
    </div>

    <section class="explorer-toolbar">
      <label for="component-selector">Componente inicial</label>
      <select id="component-selector" [(ngModel)]="selectedId" (ngModelChange)="selectComponent($event)">
        <option value="">Selecciona un componente del catálogo</option>
        @for (component of components; track component['component_id']) {
          <option [value]="String(component['component_id'])">
            {{ component['name'] }} · {{ explorer.componentType(component) }}{{ component['acronym'] ? ' · ' + component['acronym'] : '' }}
          </option>
        }
      </select>
      <div class="direction-note"><span>↘</span> Origen → proveedor / destino</div>
    </section>

    <section class="explorer-canvas" aria-label="Árbol navegable de componentes">
      @if (root) {
        <div class="canvas-caption">
          <span><i></i> Componente seleccionado</span>
          <span>Selecciona una tarjeta para expandir o contraer sus dependencias.</span>
        </div>
        <div class="tree-viewport">
          <ul class="dependency-tree">
            <ng-container
              [ngTemplateOutlet]="nodeTemplate"
              [ngTemplateOutletContext]="{ $implicit: root }">
            </ng-container>
          </ul>
        </div>
      } @else {
        <div class="explorer-empty">
          <div class="empty-graphic"><span>▣</span><i></i><b></b><em></em></div>
          <h2>Comienza por elegir un componente</h2>
          <p>El árbol se construirá al seleccionar el componente inicial y expandir sus tarjetas.</p>
        </div>
      }
    </section>

    <ng-template #nodeTemplate let-node>
      <li class="tree-node" [class.cycle-node]="node.cycle">
        <article class="component-card">
          @if (node.dependency) {
            <div class="edge-label">
              <span>{{ explorer.dependencyType(node.dependency) }}</span>
              @if (node.dependency['criticality']) { <b>{{ readable(String(node.dependency['criticality'])) }}</b> }
            </div>
          } @else {
            <div class="root-label"><i></i> INICIO DEL RECORRIDO</div>
          }

          <button class="component-card-trigger" type="button" (click)="toggle(node)" [disabled]="node.cycle"
            [attr.aria-expanded]="node.expanded">
            <span class="component-type">{{ explorer.componentType(node.component) }}</span>
            <strong class="component-title">{{ node.component['name'] }}</strong>
            <span class="component-summary">
              <span><small>Nombre</small><b>{{ node.component['name'] || '—' }}</b></span>
              <span><small>Acrónimo</small><b>{{ node.component['acronym'] || '—' }}</b></span>
              <span><small>Estatus</small><b class="status" [class.inactive]="node.component['is_active'] === 'N'"><i></i>{{ explorer.componentStatus(node.component) }}</b></span>
            </span>
            <span class="expand-prompt">
              @if (node.cycle) {
                Ciclo detectado <span class="cycle-indicator">↻</span>
              } @else if (node.expanded) {
                Contraer dependencias <span class="expand-chevron">⌃</span>
              } @else {
                Explorar dependencias <span class="expand-chevron">⌄</span>
              }
            </span>
          </button>

          <div class="component-details">
            @if (detailsFor(node.component); as detail) {
              @if (detail.description) {
                <section class="detail-section description-section">
                  <h3><span>◌</span> Descripción</h3>
                  <p>{{ detail.description }}</p>
                </section>
              }
              @if (detail.subtype.length) {
                <section class="detail-section">
                  <h3><span>◈</span> Detalle del componente</h3>
                  <div class="detail-grid">
                    @for (item of detail.subtype; track item.label) {
                      <div class="detail-item"><small>{{ item.label }}</small><b [title]="item.value">{{ item.value }}</b></div>
                    }
                  </div>
                </section>
              }
              <section class="detail-section">
                <h3><span>♙</span> Responsables y roles <em>{{ detail.people.length }}</em></h3>
                @if (detail.people.length) {
                  <div class="person-list">
                    @for (person of detail.people; track person.name + person.role) {
                      <div class="person-chip"><span class="person-avatar">{{ initials(person.name) }}</span><span><b>{{ person.name }}</b><small>{{ person.role }}</small></span></div>
                    }
                  </div>
                } @else {
                  <p class="no-detail">Sin responsables asignados</p>
                }
              </section>
              <section class="detail-section">
                <h3><span>▤</span> Stack tecnológico <em>{{ detail.technologies.length }}</em></h3>
                @if (detail.technologies.length) {
                  <div class="tag-list">@for (technology of detail.technologies; track technology) { <span class="info-tag technology-tag">{{ technology }}</span> }</div>
                } @else {
                  <p class="no-detail">Sin tecnologías registradas</p>
                }
              </section>
              <section class="detail-section">
                <h3><span>⌑</span> Despliegues <em>{{ detail.deployments.length }}</em></h3>
                @if (detail.deployments.length) {
                  <div class="tag-list">@for (deployment of detail.deployments; track deployment) { <span class="info-tag deployment-tag">{{ deployment }}</span> }</div>
                } @else {
                  <p class="no-detail">Sin despliegues registrados</p>
                }
              </section>
            }
          </div>
          @if (node.expanded && node.children?.length === 0) {
            <div class="leaf-note"><span>✓</span> No tiene dependencias salientes registradas.</div>
          }
          @if (node.cycle) {
            <div class="cycle-note">Este componente ya aparece en la ruta; se detuvo aquí para evitar un ciclo infinito.</div>
          }
        </article>

        @if (node.expanded && node.children?.length) {
          <ul class="tree-children">
            @for (child of node.children; track child.path) {
              <ng-container
                [ngTemplateOutlet]="nodeTemplate"
                [ngTemplateOutletContext]="{ $implicit: child }">
              </ng-container>
            }
          </ul>
        }
      </li>
    </ng-template>
  `,
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
