import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-dependencias',
  imports: [CatalogTableComponent],
  templateUrl: './dependencias.component.html',
  styleUrl: './dependencias.component.css',
})
export class DependenciasComponent {
  readonly table = 'dependency';
}
