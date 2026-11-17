import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-responsables-de-sistemas',
  imports: [CatalogTableComponent],
  templateUrl: './responsables-de-sistemas.component.html',
  styleUrl: './responsables-de-sistemas.component.css',
})
export class ResponsablesDeSistemasComponent {
  readonly table = 'system_responsibility';
}
