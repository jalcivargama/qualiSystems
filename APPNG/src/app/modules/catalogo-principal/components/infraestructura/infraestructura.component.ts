import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-infraestructura',
  imports: [CatalogTableComponent],
  templateUrl: './infraestructura.component.html',
  styleUrl: './infraestructura.component.css',
})
export class InfraestructuraComponent {
  readonly table = 'infrastructure_detail';
}
