import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { ResponsablesDeSistemasComponent } from '../modules/personas-y-roles/components/responsables-de-sistemas/responsables-de-sistemas.component';
import { AuthService } from '../pages/login/auth.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent navigation', () => {
  it('links Componentes to the system responsibility page', async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { displayName: 'Administrador' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    fixture.componentInstance.toggleMenu('Componentes');
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.dropdown-links a')) as HTMLAnchorElement[];
    const link = links.find((item) => item.textContent?.includes('Responsables de sistema'));
    expect(link?.getAttribute('href')).toBe('/system_responsibility');

    const shellRoutes = routes.find((route) => route.component === ShellComponent)?.children;
    expect(shellRoutes?.find((route) => route.path === 'system_responsibility')?.component)
      .toBe(ResponsablesDeSistemasComponent);
    expect(shellRoutes?.find((route) => route.path === 'catalogos/system_responsibility')?.component)
      .toBe(ResponsablesDeSistemasComponent);
  });
});
