import { Component } from '@angular/core';
import { CatalogTableComponent } from '../../../../shared/ui/catalog-table/catalog-table.component';

@Component({
  selector: 'app-roles-de-responsabilidad',
  imports: [CatalogTableComponent],
  templateUrl: './roles-de-responsabilidad.component.html',
  styleUrl: './roles-de-responsabilidad.component.css',
})
export class RolesDeResponsabilidadComponent {
  readonly table = 'responsibility_role';
}
