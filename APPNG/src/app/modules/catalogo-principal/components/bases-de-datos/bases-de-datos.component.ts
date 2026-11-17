import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-bases-de-datos',
  imports: [CatalogTableComponent],
  templateUrl: './bases-de-datos.component.html',
  styleUrl: './bases-de-datos.component.css',
})
export class BasesDeDatosComponent {
  readonly table = 'database_detail';
}
