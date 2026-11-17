import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-despliegues',
  imports: [CatalogTableComponent],
  templateUrl: './despliegues.component.html',
  styleUrl: './despliegues.component.css',
})
export class DesplieguesComponent {
  readonly table = 'system_deployment';
}
