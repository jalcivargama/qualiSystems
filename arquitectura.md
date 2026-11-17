# Arquitectura de carpetas — APPNG

Organización del cliente Angular por módulos de dominio según los grupos del menú de Catálogos.
Cada entrada del menú es un **wrapper delgado**; la UI CRUD compartida vive en `shared/ui`.

## Estructura

```text
APPNG/src/app/
  modules/
    catalogo-principal/
      components/
        componentes/          # catalog_component
        sistemas/             # system_detail
        apis/                 # api_detail
        bases-de-datos/       # database_detail
        infraestructura/      # infrastructure_detail
    operacion/
      components/
        despliegues/          # system_deployment
    personas-y-roles/
      components/
        personas/             # person
        roles-de-responsabilidad/   # responsibility_role
        responsables-de-sistemas/   # system_responsibility
    tecnologia/
      components/
        tecnologias/          # technology
        stack-tecnologico/    # component_technology
    dependencias/
      components/
        tipos-de-dependencia/ # dependency_type
        dependencias/         # dependency
        flujos-de-datos/      # data_flow
  shared/
    ui/
      catalog-table/          # CRUD genérico reutilizado por los wrappers
  core/                       # auth, catalog-store, dependency-explorer
  layout/                     # shell (menú y marco de la app)
  pages/                      # login, dashboard, explorador-dependencias
```

### Patrón wrapper + shared

Cada carpeta de catálogo solo fija la tabla y hospeda `app-catalog-table`:

```ts
@Component({
  selector: 'app-componentes',
  imports: [CatalogTableComponent],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css',
})
export class ComponentesComponent {
  readonly table = 'catalog_component';
}
```

```html
<app-catalog-table [table]="table" />
```

La lógica de listado, búsqueda, modal y persistencia mock está en `shared/ui/catalog-table`. No se duplica por pantalla.

### Módulo principal

| Carpeta | Entrada del menú | Tabla | Ruta |
| --- | --- | --- | --- |
| `componentes` | Componentes | `catalog_component` | `/catalogos/catalog_component` |
| `sistemas` | Sistemas | `system_detail` | `/catalogos/system_detail` |
| `apis` | APIs | `api_detail` | `/catalogos/api_detail` |
| `bases-de-datos` | Bases de datos | `database_detail` | `/catalogos/database_detail` |
| `infraestructura` | Infraestructura | `infrastructure_detail` | `/catalogos/infrastructure_detail` |

El mismo patrón aplica a Operación, Personas y roles, Tecnología y Dependencias.

### Contenido de cada subcomponente

Cada carpeta separa plantilla, lógica y estilos. **No** se incrusta el HTML en el `.ts`.

```text
componentes/
  componentes.component.ts
  componentes.component.html
  componentes.component.css
  componentes.component.spec.ts   # opcional al inicio
```

Queda prohibido usar `template: \`...\`` para pantallas de módulo o de `pages/`/`layout/`.

## Estilos estandarizados

| Capa | Archivo | Qué va ahí |
| --- | --- | --- |
| Tokens globales | `src/styles.css` | Variables de marca (`--brand-primary`, tipografía, foco, selección). Sin reglas de pantalla con `!important` |
| Layout | `layout/shell.component.css` | Topbar, menú, footer, área de contenido |
| Shared | `shared/ui/*.css` | Tabla CRUD, modal, botones, breadcrumbs reutilizables |
| Módulo | `*.component.css` del wrapper | Solo lo específico de esa pantalla (vacío o mínimo si basta con shared) |

Reglas:

- Los componentes usan las variables de `styles.css`. No inventan otra paleta por pantalla.
- Si un estilo sirve a dos o más módulos, pasa a `shared/ui`, no se copia.
- Se evita `!important` salvo casos puntuales documentados.
- Nombres de clase en kebab-case y con prefijo de dominio cuando haga falta (`catalog-toolbar`, `explorer-canvas`).

## Qué queda fuera de `modules`

| Carpeta | Uso |
| --- | --- |
| `core/` | Auth, repositorio del catálogo, explorador de dependencias, guards |
| `shared/` | UI reutilizable (`catalog-table`) y utilidades compartidas |
| `layout/` | Shell con el menú que agrupa los módulos |
| `pages/` | Login, dashboard y explorador de dependencias |

Las rutas del shell apuntan a los wrappers, por ejemplo `/catalogos/catalog_component` → `modules/catalogo-principal/components/componentes`.

## Criterio

Un cambio de pantalla en Sistemas se busca en `modules/catalogo-principal/components/sistemas`. Un cambio del CRUD (tabla, modal, validación) se hace en `shared/ui/catalog-table`. Los colores y tipografía vienen de las variables globales.
