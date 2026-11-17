import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-tecnologias',
  imports: [CatalogTableComponent],
  templateUrl: './tecnologias.component.html',
  styleUrl: './tecnologias.component.css',
})
export class TecnologiasComponent {
  readonly table = 'technology';
}
