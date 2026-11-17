import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-sistemas',
  imports: [CatalogTableComponent],
  templateUrl: './sistemas.component.html',
  styleUrl: './sistemas.component.css',
})
export class SistemasComponent {
  readonly table = 'system_detail';
}
