import { TestBed } from '@angular/core/testing';
import { CatalogStoreService } from './catalog-store.service';

describe('CatalogStoreService', () => {
  let store: CatalogStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(CatalogStoreService);
  });

  afterEach(() => localStorage.clear());

  it('exposes a CRUD catalog for every table in the Oracle schema', () => {
    expect(store.definitions.map((definition) => definition.table)).toEqual([
      'catalog_component',
      'system_detail',
      'api_detail',
      'database_detail',
      'infrastructure_detail',
      'system_deployment',
      'person',
      'responsibility_role',
      'system_responsibility',
      'technology',
      'component_technology',
      'dependency_type',
      'dependency',
      'data_flow',
    ]);
  });

  it('creates, updates, and removes mock records', () => {
    const table = 'dependency_type';
    const before = store.count(table);

    store.save(table, { type_code: 'WEBHOOK', type_name: 'Webhook' });
    const created = store.getRecords(table).find((record) => record['type_code'] === 'WEBHOOK');

    expect(created?.['dependency_type_id']).toBe(before + 1);
    expect(created?._mockId).toBeTruthy();

    store.save(table, { type_code: 'WEBHOOK', type_name: 'Webhook actualizado' }, created!._mockId);
    expect(store.getRecords(table).find((record) => record._mockId === created!._mockId)?.['type_name']).toBe('Webhook actualizado');

    store.remove(table, created!._mockId);
    expect(store.count(table)).toBe(before);
  });
});
