import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-apis',
  imports: [CatalogTableComponent],
  templateUrl: './apis.component.html',
  styleUrl: './apis.component.css',
})
export class ApisComponent {
  readonly table = 'api_detail';
}
