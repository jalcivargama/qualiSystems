import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DependencyExplorerApiService } from './dependency-explorer-api.service';
import { ExploradorDependenciasComponent } from './explorador-dependencias.component';
import {
  DependencyExplorerComponent,
  DependencyExplorerResponse,
} from './models/dependency-explorer-option.model';

describe('ExploradorDependenciasComponent', () => {
  let resizeCallback: ResizeObserverCallback;
  const component = (id: number, resourceType: 'I' | 'E' | null): DependencyExplorerComponent => ({
    componentId: id,
    componentType: 'API',
    componentTypeLabel: 'API',
    resourceType,
    name: `Componente ${id}`,
    acronym: null,
    isActive: 'Y',
    description: null,
    subtype: null,
    responsibilities: [],
    technologies: [],
    deployments: [],
  });
  const root = component(1, 'I');
  const response: DependencyExplorerResponse = {
    component: root,
    outgoingDependencies: (['I', 'O', 'B', null] as const).map((flowTipe, index) => ({
      dependencyId: index + 1,
      flowTipe,
      dependencyType: { dependencyTypeId: 1, typeCode: 'API', typeName: 'API' },
      dependencyScope: 'INTERNAL',
      criticality: null,
      description: null,
      createdAt: null,
      targetComponent: component(index + 2, index === 0 ? 'E' : null),
    })),
  };

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
      observe(): void {}
      disconnect(): void {}
    });
    TestBed.configureTestingModule({
      imports: [ExploradorDependenciasComponent],
      providers: [
        provideRouter([]),
        { provide: DependencyExplorerApiService, useValue: {
          getComponents: () => of([root]),
          getComponent: () => of(response),
        } },
      ],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders resource icons and independent flow endpoints, and redraws after resizing', async () => {
    const fixture = TestBed.createComponent(ExploradorDependenciasComponent);
    fixture.detectChanges();
    fixture.componentInstance.selectedId = '1';
    fixture.componentInstance.selectComponent('1');
    fixture.componentInstance.toggle(fixture.componentInstance.root!);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const cards = host.querySelectorAll<HTMLElement>('.component-card');
    expect(cards[0].querySelector('img')?.getAttribute('title')).toBe('Recurso interno');
    expect(cards[0].querySelector('img')?.getAttribute('src')).toBe('assets/internal.jpg');
    expect(cards[1].querySelector('img')?.getAttribute('title')).toBe('Proveedor');
    expect(cards[1].querySelector('img')?.getAttribute('src')).toBe('assets/external.png');
    expect(cards[2].querySelector('img')).toBeNull();

    const list = host.querySelector<HTMLUListElement>('.tree-children')!;
    let childTop = 100;
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 50, 1000, 200));
    vi.spyOn(cards[0], 'getBoundingClientRect').mockReturnValue(new DOMRect(350, 0, 300, 50));
    cards.forEach((card, index) => {
      if (index > 0) {
        vi.spyOn(card, 'getBoundingClientRect').mockImplementation(
          () => new DOMRect((index - 1) * 250, childTop, 200, 50),
        );
      }
    });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const svg = list.querySelector('svg')!;
    expect(Array.from(svg.children).map((element) => element.tagName.toLowerCase())).toEqual([
      'path', 'polygon', 'circle',
      'path', 'circle', 'polygon',
      'path', 'circle', 'polygon',
      'path',
    ]);
    expect(svg.children[1].getAttribute('points')).toContain(',0 ');
    expect(svg.children[2].getAttribute('cy')).toBe('47');
    expect(svg.children[4].getAttribute('cy')).toBe('3');
    expect(svg.children[5].getAttribute('points')).toContain(',50 ');

    childTop = 120;
    resizeCallback([], {} as ResizeObserver);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(svg.children[2].getAttribute('cy')).toBe('67');
    fixture.destroy();
  });
});
