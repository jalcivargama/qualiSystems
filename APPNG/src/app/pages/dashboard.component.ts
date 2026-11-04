import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogStoreService, MockRecord } from '../core/catalog-store.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page-heading">
      <div>
        <div class="breadcrumbs"><span>Workspace</span><span>/</span><strong>Dashboard</strong></div>
        <h1>Vista general</h1>
        <p>Un resumen de tu arquitectura y sus conexiones clave.</p>
      </div>
      <div class="heading-actions"><span class="updated-label"><span></span> Datos de demostración</span></div>
    </div>

    <section class="metric-grid" aria-label="Indicadores principales">
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon icon-systems">▣</span><span class="metric-trend">+2 este mes</span></div>
        <span class="metric-label">Sistemas registrados</span><strong>{{ systemCount }}</strong>
        <span class="metric-foot">Activos en el catálogo</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon icon-deps">⌘</span><span class="metric-trend neutral">Mapa conectado</span></div>
        <span class="metric-label">Dependencias</span><strong>{{ dependencyCount }}</strong>
        <span class="metric-foot">Relaciones entre componentes</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon icon-api">↗</span><span class="metric-trend">+1 este mes</span></div>
        <span class="metric-label">APIs catalogadas</span><strong>{{ apiCount }}</strong>
        <span class="metric-foot">Servicios disponibles</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon icon-alert">!</span><span class="metric-trend alert-trend">Requiere atención</span></div>
        <span class="metric-label">Dependencias críticas</span><strong>{{ criticalCount }}</strong>
        <span class="metric-foot">Impacto potencial alto</span>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel architecture-panel">
        <div class="panel-heading">
          <div><span class="panel-kicker">ARQUITECTURA</span><h2>Mapa de dependencias</h2><p>Vista simplificada de los componentes conectados</p></div>
          <a routerLink="/catalogos/dependency" class="panel-link">Ver dependencias <span>→</span></a>
        </div>
        <div class="architecture-map">
          <div class="map-column">
            <div class="map-node system-node"><span class="node-glyph">▣</span><div><strong>Portal de clientes</strong><small>Sistema · Producción</small></div><span class="node-status"></span></div>
          </div>
          <div class="map-connectors"><span></span><span></span></div>
          <div class="map-column map-middle">
            <div class="map-node api-node"><span class="node-glyph">↗</span><div><strong>API Clientes</strong><small>REST · v2.4</small></div><span class="node-status"></span></div>
            <div class="map-node api-node"><span class="node-glyph">↗</span><div><strong>API Pagos</strong><small>REST · v1.8</small></div><span class="node-status"></span></div>
          </div>
          <div class="map-connectors"><span></span><span></span></div>
          <div class="map-column">
            <div class="map-node database-node"><span class="node-glyph">◈</span><div><strong>Oracle Clientes</strong><small>Base de datos · 19c</small></div><span class="node-status"></span></div>
            <div class="map-node message-node"><span class="node-glyph">≋</span><div><strong>Kafka Eventos</strong><small>Mensajería · Interna</small></div><span class="node-status"></span></div>
          </div>
        </div>
        <div class="map-legend"><span><i class="legend-system"></i>Sistema</span><span><i class="legend-api"></i>API</span><span><i class="legend-data"></i>Datos y mensajería</span><span class="legend-note">Las flechas representan el sentido de la dependencia</span></div>
      </article>

      <article class="panel health-panel">
        <div class="panel-heading"><div><span class="panel-kicker">ESTADO</span><h2>Salud del catálogo</h2></div><button class="more-button" aria-label="Más opciones">···</button></div>
        <div class="health-score"><div class="score-ring"><strong>92</strong><span>/ 100</span></div><div><strong>Muy buena</strong><small>Calidad de información</small></div></div>
        <div class="health-list">
          <div><span class="health-check">✓</span><span>Componentes con responsable</span><strong>94%</strong></div>
          <div><span class="health-check">✓</span><span>Dependencias documentadas</span><strong>88%</strong></div>
          <div><span class="health-pending">!</span><span>Sistemas por revisar</span><strong>2</strong></div>
        </div>
        <a routerLink="/catalogos/catalog_component" class="health-link">Revisar catálogo <span>→</span></a>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="panel recent-panel">
        <div class="panel-heading"><div><span class="panel-kicker">ACTIVIDAD</span><h2>Sistemas destacados</h2></div><a routerLink="/catalogos/system_detail" class="panel-link">Ver sistemas <span>→</span></a></div>
        <div class="systems-table">
          <div class="systems-row systems-header"><span>SISTEMA</span><span>ÁREA PROPIETARIA</span><span>CRITICIDAD</span><span>ESTADO</span></div>
          @for (system of systems; track system['component_id']) {
            <div class="systems-row">
              <span class="system-name"><i>{{ initials(system.name) }}</i><strong>{{ system.name }}</strong></span>
              <span>{{ system['owner_area'] }}</span>
              <span><b class="severity" [class.high]="system['criticality'] === 'HIGH'" [class.critical]="system['criticality'] === 'CRITICAL'">{{ readable(system['criticality']) }}</b></span>
              <span><b class="status-pill"><i></i>{{ readable(system['system_status']) }}</b></span>
            </div>
          }
        </div>
      </article>
      <article class="panel quick-panel">
        <div class="panel-heading"><div><span class="panel-kicker">ACCESO RÁPIDO</span><h2>Explorar catálogos</h2></div></div>
        <div class="quick-links">
          <a routerLink="/catalogos/catalog_component"><span class="quick-icon q-green">▣</span><span><strong>Componentes</strong><small>Explora todos los nodos</small></span><b>→</b></a>
          <a routerLink="/catalogos/dependency"><span class="quick-icon q-purple">⌘</span><span><strong>Dependencias</strong><small>Relaciones entre sistemas</small></span><b>→</b></a>
          <a routerLink="/catalogos/person"><span class="quick-icon q-yellow">♙</span><span><strong>Responsables</strong><small>Personas y roles asignados</small></span><b>→</b></a>
        </div>
      </article>
    </section>
  `,
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
