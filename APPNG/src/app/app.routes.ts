import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './pages/login/auth.service';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ExploradorDependenciasComponent } from './pages/explorador-dependencias/explorador-dependencias.component';
import { ComponentDiagramComponent } from './pages/component-diagram/component-diagram.component';
import { ComponentesComponent } from './modules/catalogo-principal/components/componentes/components/componentes.component';
import { SistemasComponent } from './modules/catalogo-principal/components/sistemas/sistemas.component';
import { ApisComponent } from './modules/catalogo-principal/components/apis/components/apis.component';
import { BasesDeDatosComponent } from './modules/catalogo-principal/components/bases-de-datos/bases-de-datos.component';
import { InfraestructuraComponent } from './modules/catalogo-principal/components/infraestructura/infraestructura.component';
import { DesplieguesComponent } from './modules/operacion/components/despliegues/despliegues.component';
import { PersonasComponent } from './modules/personas-y-roles/components/personas/personas.component';
import { RolesDeResponsabilidadComponent } from './modules/personas-y-roles/components/roles-de-responsabilidad/roles-de-responsabilidad.component';
import { ResponsablesDeSistemasComponent } from './modules/personas-y-roles/components/responsables-de-sistemas/responsables-de-sistemas.component';
import { AreasComponent } from './modules/areas/components/areas/areas.component';
import { TecnologiasComponent } from './modules/tecnologia/components/tecnologias/tecnologias.component';
import { StackTecnologicoComponent } from './modules/tecnologia/components/stack-tecnologico/stack-tecnologico.component';
import { TiposDeDependenciaComponent } from './modules/dependencias/components/tipos-de-dependencia/tipos-de-dependencia.component';
import { DependenciasComponent } from './modules/dependencias/components/dependencias/dependencias.component';
import { FlujosDeDatosComponent } from './modules/dependencias/components/flujos-de-datos/flujos-de-datos.component';
import { BusquedaComponentesComponent } from './pages/busqueda-componentes/busqueda-componentes.component';

const requireSession = () => {
  const auth = inject(AuthService);
  if (auth.hasSession()) return true;
  return inject(Router).createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [requireSession],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'busqueda-componentes', component: BusquedaComponentesComponent },
      { path: 'explorador-dependencias', component: ExploradorDependenciasComponent },
      { path: 'component-diagram', component: ComponentDiagramComponent },
      { path: 'catalogos/catalog_component', component: ComponentesComponent },
      { path: 'catalogos/system_detail', component: SistemasComponent },
      { path: 'catalogos/api_detail', component: ApisComponent },
      { path: 'catalogos/database_detail', component: BasesDeDatosComponent },
      { path: 'catalogos/infrastructure_detail', component: InfraestructuraComponent },
      { path: 'catalogos/system_deployment', component: DesplieguesComponent },
      { path: 'catalogos/person', component: PersonasComponent },
      { path: 'catalogos/responsibility_role', component: RolesDeResponsabilidadComponent },
      { path: 'catalogos/system_responsibility', component: ResponsablesDeSistemasComponent },
      { path: 'system_responsibility', component: ResponsablesDeSistemasComponent },
      { path: 'catalogos/area', component: AreasComponent },
      { path: 'catalogos/technology', component: TecnologiasComponent },
      { path: 'catalogos/component_technology', component: StackTecnologicoComponent },
      { path: 'catalogos/dependency_type', component: TiposDeDependenciaComponent },
      { path: 'catalogos/dependency', component: DependenciasComponent },
      { path: 'catalogos/data_flow', component: FlujosDeDatosComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
