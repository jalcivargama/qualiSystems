import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-flujos-de-datos',
  imports: [CatalogTableComponent],
  templateUrl: './flujos-de-datos.component.html',
  styleUrl: './flujos-de-datos.component.css',
})
export class FlujosDeDatosComponent {
  readonly table = 'data_flow';
}
