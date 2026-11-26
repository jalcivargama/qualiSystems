import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { ShellComponent } from '../../layout/shell.component';
import { AuthService } from '../login/auth.service';
import { DependencyExplorerApiService } from '../explorador-dependencias/dependency-explorer-api.service';
import { ExploradorDependenciasComponent } from '../explorador-dependencias/explorador-dependencias.component';
import {
  DependencyExplorerComponent,
  DependencyExplorerResponse,
} from '../explorador-dependencias/models/dependency-explorer-option.model';
import { ComponentType } from '../../modules/catalogo-principal/components/componentes/models/component.model';
import { ComponentDiagramComponent } from './component-diagram.component';

describe('ComponentDiagramComponent', () => {
  const component = (id: number, componentType: ComponentType): DependencyExplorerComponent => ({
    componentId: id,
    componentType,
    componentTypeLabel: componentType,
    resourceType: id === 1 ? 'I' : 'E',
    name: `Componente ${id}`,
    acronym: `C${id}`,
    isActive: 'Y',
    description: 'Descripción',
    subtype: null,
    responsibilities: [],
    technologies: [],
    deployments: [],
  });
  const root = component(1, 'SYSTEM');
  const targets = [
    component(2, 'DATABASE'),
    component(3, 'API'),
    component(4, 'INFRASTRUCTURE'),
    component(5, 'EXTERNAL_SERVICE'),
  ];
  const response: DependencyExplorerResponse = {
    component: root,
    outgoingDependencies: targets.map((target, index) => ({
      dependencyId: index + 1,
      flowTipe: 'O',
      dependencyType: { dependencyTypeId: 1, typeCode: 'API', typeName: 'API' },
      dependencyScope: 'INTERNAL',
      criticality: null,
      description: null,
      createdAt: null,
      targetComponent: target,
    })),
  };
  const getComponent = vi.fn((id: number) => of(
    id === 1 ? response : { component: targets[id - 2], outgoingDependencies: [] },
  ));

  beforeEach(() => {
    getComponent.mockClear();
    vi.stubGlobal('ResizeObserver', class {
      observe(): void {}
      disconnect(): void {}
    });
    TestBed.configureTestingModule({
      imports: [ComponentDiagramComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: {} },
        { provide: DependencyExplorerApiService, useValue: {
          getComponents: () => of([root, ...targets]),
          getComponent,
        } },
      ],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('registers the architecture route in the Inicio menu', () => {
    const shell = new ShellComponent(TestBed.inject(AuthService));
    expect(shell.navigationGroups.find((group) => group.label === 'Inicio')?.items)
      .toContainEqual({ label: 'Arquitectura', route: '/component-diagram' });
    const shellRoute = routes.find((route) => route.component === ShellComponent);
    expect(shellRoute?.children?.find((route) => route.path === 'component-diagram')?.component)
      .toBe(ComponentDiagramComponent);
  });

  it('shows summary cards with type images and expands using the explorer API', () => {
    const fixture = TestBed.createComponent(ComponentDiagramComponent);
    fixture.detectChanges();
    const explorer = fixture.debugElement.query(By.directive(ExploradorDependenciasComponent))
      .componentInstance as ExploradorDependenciasComponent;
    explorer.onComponentSelected('1');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent).toBe('Arquitectura');
    expect(host.querySelector('.diagram-type-icon')?.getAttribute('src')).toBe('assets/system.png');
    expect(host.querySelector('.resource-icon')?.getAttribute('title')).toBe('Recurso interno');
    expect(host.querySelector('.details-toggle')).toBeNull();
    expect(host.querySelector('.component-details')).toBeNull();
    expect(host.querySelector('.expand-prompt')).toBeNull();

    host.querySelector<HTMLButtonElement>('.component-card-trigger')!.click();
    fixture.detectChanges();
    const cards = host.querySelectorAll<HTMLElement>('.component-card');
    expect(cards).toHaveLength(5);
    expect(Array.from(cards, (card) => card.querySelector('.diagram-type-icon')?.getAttribute('src') ?? null))
      .toEqual(['assets/system.png', 'assets/database.png', 'assets/api.png', 'assets/server.png', null]);
    expect(cards[1].querySelector('.resource-icon')?.getAttribute('title')).toBe('Proveedor');
    expect(cards[1].textContent).toContain('C2');
    expect(host.querySelector('.dependency-connections')).not.toBeNull();

    cards[1].querySelector<HTMLButtonElement>('.component-card-trigger')!.click();
    fixture.detectChanges();
    expect(getComponent.mock.calls.map(([id]) => id)).toEqual([1, 2]);
    expect(cards[1].textContent).toContain('No tiene dependencias salientes');

    explorer.root!.children![2].component['component_type'] = 'INFRAESTRUCTURE';
    fixture.detectChanges();
    expect(cards[3].querySelector('.diagram-type-icon')?.getAttribute('src')).toBe('assets/server.png');

    cards[0].querySelector<HTMLButtonElement>('.component-card-trigger')!.click();
    fixture.detectChanges();
    expect(host.querySelectorAll('.component-card')).toHaveLength(1);
    fixture.destroy();
  });
});
