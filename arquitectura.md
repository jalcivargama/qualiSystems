# Arquitectura de carpetas — APPNG

Convenciones para organizar el cliente Angular cuando el prototipo pase de pantallas sueltas a módulos por dominio.
Los grupos del menú de Catálogos (imagen de referencia del prototipo) definen los módulos.

## Estructura recomendada

Dentro de `APPNG/src/app` se crea la carpeta `modules`. Cada grupo del menú es un módulo. Dentro del módulo va la carpeta `components` y, debajo, una carpeta por cada entrada del menú.

```text
APPNG/src/app/
  modules/
    catalogo-principal/
      components/
        componentes/
        sistemas/
        apis/
        bases-de-datos/
        infraestructura/
    operacion/
      components/
        despliegues/
    personas-y-roles/
      components/
        personas/
        roles-de-responsabilidad/
        responsables-de-sistemas/
    tecnologia/
      components/
        tecnologias/
        stack-tecnologico/
    dependencias/
      components/
        tipos-de-dependencia/
        dependencias/
        flujos-de-datos/
  core/
  shared/
  layout/
  pages/          # login, dashboard, explorador (fuera del menú de catálogos)
```

### Módulo principal

`catalogo-principal` es el módulo principal. Ahí vive `components` y, dentro, los subcomponentes del menú:

| Carpeta | Entrada del menú | Tabla |
| --- | --- | --- |
| `componentes` | Componentes | `catalog_component` |
| `sistemas` | Sistemas | `system_detail` |
| `apis` | APIs | `api_detail` |
| `bases-de-datos` | Bases de datos | `database_detail` |
| `infraestructura` | Infraestructura | `infrastructure_detail` |

El mismo patrón aplica a Operación, Personas y roles, Tecnología y Dependencias: módulo → `components` → carpeta por subcomponente.

### Contenido de cada subcomponente

Cada carpeta de subcomponente separa plantilla, lógica y estilos. **No** se incrusta el HTML en el `.ts`.

```text
componentes/
  componentes.component.ts
  componentes.component.html
  componentes.component.css
  componentes.component.spec.ts   # opcional al inicio
```

En el decorador:

```ts
@Component({
  selector: 'app-componentes',
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css',
})
export class ComponentesComponent {}
```

Queda prohibido usar `template: \`...\`` para pantallas de módulo. Las plantillas largas del prototipo actual (`catalog`, `dashboard`, `shell`, `explorador`) se mueven a `.html` al reorganizar.

## Estilos estandarizados

| Capa | Archivo | Qué va ahí |
| --- | --- | --- |
| Tokens globales | `src/styles.css` | Variables de marca (`--brand-primary`, tipografía, foco, selección). Sin reglas de pantalla con `!important` |
| Layout | `layout/shell.component.css` | Topbar, menú, footer, área de contenido |
| Shared | `shared/ui/*.css` | Tabla, modal, botones, breadcrumbs, badges reutilizables |
| Módulo | `*.component.css` del subcomponente | Solo lo específico de esa pantalla |

Reglas:

- Los componentes usan las variables de `styles.css`. No inventan otra paleta por pantalla.
- Si un estilo sirve a dos o más módulos, pasa a `shared/ui`, no se copia.
- Se evita `!important` salvo casos puntuales documentados. La marca se aplica con variables y selectores, no pisando cada CSS de componente.
- Nombres de clase en kebab-case y con prefijo de dominio cuando haga falta (`catalog-toolbar`, `explorer-canvas`), no genéricos sueltos que choquen entre módulos.

## Qué queda fuera de `modules`

| Carpeta | Uso |
| --- | --- |
| `core/` | Auth, repositorio del catálogo, cliente HTTP, guards |
| `shared/` | UI reutilizable (tabla genérica, modal, campo) y utilidades de etiquetas |
| `layout/` | Shell con el menú que agrupa los módulos |
| `pages/` | Login, dashboard y explorador de dependencias, que no son entradas del menú de catálogos |

Las rutas del shell apuntan a los componentes de cada módulo, por ejemplo `/catalogos/catalog_component` → `modules/catalogo-principal/components/componentes`.

## Criterio

Un cambio en Sistemas se busca en `modules/catalogo-principal/components/sistemas`. El HTML está en su `.html`. Los colores y tipografía vienen de las variables globales. Si hace falta el mismo botón o modal en otro módulo, se toma de `shared/ui`.
