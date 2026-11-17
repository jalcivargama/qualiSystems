import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-componentes',
  imports: [CatalogTableComponent],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css',
})
export class ComponentesComponent {
  readonly table = 'catalog_component';
}
