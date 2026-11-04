import { TestBed } from '@angular/core/testing';
import { CatalogStoreService } from './catalog-store.service';
import { DependencyExplorerService } from './dependency-explorer.service';

describe('DependencyExplorerService', () => {
  let catalog: CatalogStoreService;
  let explorer: DependencyExplorerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    catalog = TestBed.inject(CatalogStoreService);
    explorer = TestBed.inject(DependencyExplorerService);
  });

  afterEach(() => localStorage.clear());

  it('starts with one component and builds outgoing dependency levels on demand', () => {
    const root = explorer.createRoot(explorer.components.find((item) => item['component_id'] === 1)!);
    expect(root.children).toBeNull();

    explorer.toggle(root);
    expect(root.children?.map((node) => node.component['name'])).toEqual(['API Clientes']);

    explorer.toggle(root.children![0]);
    expect(root.children![0].children?.map((node) => node.component['name'])).toEqual(['Oracle Clientes']);
  });

  it('marks a repeated component in the current branch to stop dependency cycles', () => {
    catalog.save('dependency', {
      origin_component_id: '3',
      target_component_id: '1',
      dependency_type_id: '1',
      dependency_scope: 'INTERNAL',
      criticality: 'LOW',
    });
    const root = explorer.createRoot(explorer.components.find((item) => item['component_id'] === 1)!);

    explorer.toggle(root);
    const api = root.children![0];
    explorer.toggle(api);
    const database = api.children![0];
    explorer.toggle(database);

    expect(database.children).toHaveLength(1);
    expect(database.children![0].cycle).toBe(true);
  });

  it('collects subtype, responsibility, technology, and deployment details', () => {
    const portal = explorer.components.find((item) => item['component_id'] === 1)!;
    const details = explorer.details(portal);

    expect(details.subtype.some((item) => item.label === 'Área propietaria' && item.value === 'Experiencia de Cliente')).toBe(true);
    expect(details.people).toContainEqual({ name: 'María López', role: 'Responsable técnico' });
    expect(details.technologies).toContain('Angular · 21');
    expect(details.deployments).toContain('Producción · https://portal.demo.local');
  });
});
