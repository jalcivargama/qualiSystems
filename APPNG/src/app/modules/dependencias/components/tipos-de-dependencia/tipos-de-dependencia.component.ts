import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-tipos-de-dependencia',
  imports: [CatalogTableComponent],
  templateUrl: './tipos-de-dependencia.component.html',
  styleUrl: './tipos-de-dependencia.component.css',
})
export class TiposDeDependenciaComponent {
  readonly table = 'dependency_type';
}
