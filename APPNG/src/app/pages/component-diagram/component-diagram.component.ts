import { Component } from '@angular/core';
import { ExploradorDependenciasComponent } from '../explorador-dependencias/explorador-dependencias.component';

@Component({
  selector: 'app-component-diagram',
  imports: [ExploradorDependenciasComponent],
  template: '<app-explorador-dependencias [diagramMode]="true" />',
})
export class ComponentDiagramComponent {}
