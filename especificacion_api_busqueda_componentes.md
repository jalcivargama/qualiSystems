# Especificación API: Búsqueda de Componentes

## 1. Objetivo

Proporcionar el endpoint agregado que alimenta la vista `/busqueda-componentes`.

La búsqueda debe localizar componentes que cumplan **al menos uno** de los criterios
enviados:

- Tipo de componente.
- Nombre.
- Acrónimo.
- Tecnología relacionada mediante `component_technology`.
- Persona responsable mediante `system_responsibility`.

Los criterios se combinan con `OR`. Dentro de listas como tipos, tecnologías o
personas, la coincidencia también usa `OR`.

## 2. Seguridad

Todos los endpoints requieren el encabezado:

```http
Authorization: Bearer <JWT>
```

Una petición sin token válido debe devolver `401 Unauthorized`.

## 3. Endpoint de búsqueda

### Solicitud

```http
POST /sysapi/catalogos/dependency-explorer/search
Content-Type: application/json
Authorization: Bearer <JWT>
```

```json
{
  "componentTypes": ["SYSTEM", "API"],
  "name": "QRed",
  "acronym": "QRP",
  "technologyIds": [1, 5],
  "personIds": [2, 8]
}
```

### Reglas del body

| Campo | Tipo | Obligatorio | Validación |
|---|---|---:|---|
| `componentTypes` | `ComponentType[]` | Sí | Lista vacía permitida. Máximo 6 valores. |
| `name` | `string` | Sí | `null` o texto de 1 a 200 caracteres. |
| `acronym` | `string` | Sí | `null` o texto de 1 a 50 caracteres. |
| `technologyIds` | `number[]` | Sí | Identificadores positivos. |
| `personIds` | `number[]` | Sí | Identificadores positivos. |

El frontend bloquea una búsqueda con todos los criterios vacíos. El backend debe
revalidar esta regla y devolver `400 Bad Request`.

### Respuesta exitosa

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
[
  {
    "componentId": 8,
    "componentType": "API",
    "componentTypeLabel": "API",
    "name": "QRedProveedoresAPI",
    "acronym": "QRP",
    "description": "API para consulta de proveedores",
    "isActive": "Y",
    "technologies": [
      {
        "technologyId": 7,
        "name": "Java",
        "version": "21"
      }
    ],
    "responsibilities": [
      {
        "personId": 2,
        "fullName": "Carlos Méndez",
        "roleName": "Responsable técnico"
      }
    ]
  }
]
```

Las listas `technologies` y `responsibilities` nunca se devuelven como `null`.
Cuando no existen relaciones, se devuelve `[]`.

## 4. Semántica de búsqueda

Un componente se incluye cuando se cumple cualquiera de estas condiciones:

```text
component_type IN componentTypes
OR LOWER(name) LIKE '%' || LOWER(:name) || '%'
OR LOWER(acronym) LIKE '%' || LOWER(:acronym) || '%'
OR EXISTS component_technology con technology_id IN technologyIds
OR EXISTS system_responsibility con person_id IN personIds
```

Ejemplos:

- Si se selecciona `API` y `Angular`, se devuelven los componentes API más
  cualquier componente que use Angular.
- Si se escribe `SAC` en nombre y se selecciona `Carlos Méndez`, se devuelven
  los componentes cuyo nombre contenga `SAC` y también los asignados a Carlos.
- Si una tecnología coincide, no es necesario que los datos generales también
  coincidan.
- Nombre y acrónimo son búsquedas parciales, sin distinguir mayúsculas y
  minúsculas.

## 5. Catálogos usados por los filtros

La vista reutiliza los endpoints existentes para cargar los filtros:

```http
GET /sysapi/catalogos/technologies
GET /sysapi/catalogos/people
```

La búsqueda no usa nuevos endpoints para estos catálogos.

## 6. Enums

### `ComponentType`

```text
SYSTEM
API
DATABASE
INFRASTRUCTURE
EXTERNAL_SERVICE
MESSAGING
```

Etiquetas:

| Código | Etiqueta |
|---|---|
| `SYSTEM` | Sistema |
| `API` | API |
| `DATABASE` | Base de datos |
| `INFRASTRUCTURE` | Infraestructura |
| `EXTERNAL_SERVICE` | Servicio externo |
| `MESSAGING` | Mensajería |

### `isActive`

```text
Y
N
```

## 7. DTO Spring Boot

```java
public record ComponentSearchRequest(
    Set<ComponentType> componentTypes,
    String name,
    String acronym,
    Set<Long> technologyIds,
    Set<Long> personIds
) {}

public record ComponentSearchResult(
    Long componentId,
    ComponentType componentType,
    String componentTypeLabel,
    String name,
    String acronym,
    String description,
    String isActive,
    List<ComponentSearchTechnology> technologies,
    List<ComponentSearchResponsibility> responsibilities
) {}

public record ComponentSearchTechnology(
    Long technologyId,
    String name,
    String version
) {}

public record ComponentSearchResponsibility(
    Long personId,
    String fullName,
    String roleName
) {}
```

`ComponentType` debe validarse contra los valores del modelo Oracle.

## 8. Consulta y estrategia de carga

La implementación debe evitar un producto cartesiano entre tecnologías y
responsables.

Flujo sugerido:

1. Consultar IDs de componentes que coincidan mediante condiciones `OR`.
2. Ordenar componentes por `LOWER(name)` y luego `component_id`.
3. Consultar tecnologías para todos los IDs con `IN (:componentIds)`.
4. Consultar responsables y roles para todos los IDs con `IN (:componentIds)`.
5. Agrupar ambos resultados por `component_id`.
6. Construir los DTOs sin realizar consultas N+1.

Condición de coincidencia en Oracle:

```sql
(
    c.component_type IN (:componentTypes)
    OR (:name IS NOT NULL AND LOWER(c.name) LIKE '%' || LOWER(:name) || '%')
    OR (:acronym IS NOT NULL AND LOWER(c.acronym) LIKE '%' || LOWER(:acronym) || '%')
    OR EXISTS (
        SELECT 1
        FROM component_technology ct
        WHERE ct.component_id = c.component_id
          AND ct.technology_id IN (:technologyIds)
    )
    OR EXISTS (
        SELECT 1
        FROM system_responsibility sr
        WHERE sr.component_id = c.component_id
          AND sr.person_id IN (:personIds)
    )
)
```

Las condiciones asociadas a listas vacías deben omitirse al construir la
consulta dinámica, ya que una cláusula `IN` vacía no es portable.

## 9. Mapeo Oracle

| JSON | Origen |
|---|---|
| `componentId` | `catalog_component.component_id` |
| `componentType` | `catalog_component.component_type` |
| `name` | `catalog_component.name` |
| `acronym` | `catalog_component.acronym` |
| `description` | `catalog_component.description` |
| `isActive` | `catalog_component.is_active` |
| `technologyId` | `technology.technology_id` |
| `technology.name` | `technology.name` |
| `version` | `component_technology.version` |
| `personId` | `person.person_id` |
| `fullName` | `person.full_name` |
| `roleName` | `responsibility_role.role_name` |

## 10. Errores

### Sin criterios

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "timestamp": "2026-11-22T17:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Se requiere al menos un criterio de búsqueda",
  "path": "/sysapi/catalogos/dependency-explorer/search"
}
```

### Valores inválidos

Los IDs negativos, tipos desconocidos o textos que exceden la longitud permitida
deben devolver `400`.

## 11. Orden

- Resultados ordenados por nombre sin distinguir mayúsculas y minúsculas.
- Tecnologías ordenadas por nombre.
- Responsables ordenados por nombre y luego por rol.

## 12. Integración con el explorador

Al hacer doble clic sobre un resultado, Angular navega a:

```text
/explorador-dependencias?componentId={componentId}
```

El explorador:

1. Reutiliza el endpoint existente:
   `/catalogos/dependency-explorer/components`.
2. Selecciona el valor del selector.
3. Reutiliza el endpoint existente:
   `/catalogos/dependency-explorer/components/{componentId}`.
4. Muestra la tarjeta raíz sin expandir dependencias.

No se debe crear un endpoint adicional para esta navegación.

## 13. Criterios de aceptación

- Los filtros se cargan desde los catálogos existentes de tecnologías y personas.
- Una búsqueda vacía no llega al endpoint desde el frontend.
- El backend vuelve a validar que exista al menos un criterio.
- Los criterios se combinan con `OR`.
- Un componente se devuelve una sola vez aunque coincida con varios criterios.
- Cada resultado incluye tecnologías y responsables agrupados por componente.
- Un resultado sin relaciones devuelve listas vacías.
- Hacer doble clic abre `/explorador-dependencias?componentId=...`.
- La tarjeta raíz aparece seleccionada y cargada desde el endpoint del explorador.
