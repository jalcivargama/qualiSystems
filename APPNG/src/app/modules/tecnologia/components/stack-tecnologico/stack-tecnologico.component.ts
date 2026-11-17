import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-stack-tecnologico',
  imports: [CatalogTableComponent],
  templateUrl: './stack-tecnologico.component.html',
  styleUrl: './stack-tecnologico.component.css',
})
export class StackTecnologicoComponent {
  readonly table = 'component_technology';
}
