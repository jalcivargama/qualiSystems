# Especificación de API: Explorador de Dependencias

## 1. Objetivo

Definir el contrato JSON que necesita la vista `/explorador-dependencias` para:

1. Cargar el selector de componente inicial.
2. Desplegar cada tarjeta con sus datos de componente y detalle específico.
3. Expandir las dependencias salientes bajo demanda.
4. Detectar ciclos sin construir un árbol recursivo infinito en el backend.

La vista actualmente obtiene y cruza datos de las tablas:

- `catalog_component`
- `system_detail`
- `api_detail`
- `database_detail`
- `infrastructure_detail`
- `person`
- `responsibility_role`
- `system_responsibility`
- `technology`
- `component_technology`
- `system_deployment`
- `dependency`
- `dependency_type`

`data_flow` existe en el modelo Oracle, pero no se muestra en las tarjetas actuales.

## 2. Convenciones generales

- URL base configurada por el frontend: `http://localhost:8080/sysapi`.
- Formato: `application/json`.
- Codificación: UTF-8.
- Identificadores: números JSON (`number`), mapeados a `Long` en Spring Boot.
- Fechas: `YYYY-MM-DD`.
- Fechas y horas: ISO 8601, por ejemplo `2026-05-20T10:15:30Z`.
- Nombres de propiedades: `camelCase`.
- Los campos sin información se devuelven como `null`.
- Las listas vacías se devuelven como `[]`; nunca como `null`.
- Los valores de los catálogos se devuelven con su código original, no traducidos.
- Orden recomendado de componentes: `name ASC`.
- Orden recomendado de dependencias: `targetComponent.name ASC`, con desempate por `dependencyId ASC`.

## 3. Endpoint para el selector

### 3.1 Solicitud

```http
GET /sysapi/catalogos/dependency-explorer/components
```

### 3.2 Respuesta

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
[
  {
    "componentId": 2,
    "componentType": "API",
    "componentTypeLabel": "API",
    "name": "API Clientes",
    "acronym": "API-C",
    "isActive": "Y"
  },
  {
    "componentId": 4,
    "componentType": "SYSTEM",
    "componentTypeLabel": "Sistema",
    "name": "Gestión de pagos",
    "acronym": "PAGOS",
    "isActive": "Y"
  },
  {
    "componentId": 3,
    "componentType": "DATABASE",
    "componentTypeLabel": "Base de datos",
    "name": "Oracle Clientes",
    "acronym": "DB-CLI",
    "isActive": "Y"
  },
  {
    "componentId": 1,
    "componentType": "SYSTEM",
    "componentTypeLabel": "Sistema",
    "name": "Portal de clientes",
    "acronym": "PORTAL",
    "isActive": "Y"
  }
]
```

### 3.3 Campos

| Campo | Tipo | Nulable | Uso en la vista |
|---|---|---:|---|
| `componentId` | `number` | No | Valor del selector y ruta de detalle. |
| `componentType` | `enum` | No | Código del tipo de componente. |
| `componentTypeLabel` | `string` | No | Etiqueta visible del tipo. |
| `name` | `string` | No | Nombre visible. |
| `acronym` | `string` | Sí | Etiqueta secundaria del selector. |
| `isActive` | `"Y" \| "N"` | No | Estatus del componente. |

## 4. Endpoint para una tarjeta y sus dependencias directas

### 4.1 Solicitud

```http
GET /sysapi/catalogos/dependency-explorer/components/{componentId}
```

Ejemplo:

```http
GET /sysapi/catalogos/dependency-explorer/components/1
```

Al seleccionar o volver a expandir una tarjeta, el frontend solicita este endpoint para obtener:

- Datos completos de la tarjeta actual.
- Las dependencias salientes directas.
- Datos completos de la tarjeta destino de cada dependencia.

El backend no debe recursar indefinidamente. Cada `targetComponent` contiene los datos de una tarjeta, pero no contiene sus `outgoingDependencies`.

### 4.2 Respuesta basada en el mock

```json
{
  "component": {
    "componentId": 1,
    "componentType": "SYSTEM",
    "componentTypeLabel": "Sistema",
    "name": "Portal de clientes",
    "acronym": "PORTAL",
    "description": "Canal digital de clientes",
    "isActive": "Y",
    "subtype": {
      "type": "SYSTEM",
      "businessObjective": "Atender operaciones de clientes por canal digital.",
      "ownerArea": "Experiencia de Cliente",
      "criticality": "HIGH",
      "systemStatus": "ACTIVE",
      "goLiveDate": "2022-05-10",
      "endOfLifeDate": null
    },
    "responsibilities": [
      {
        "personId": 1,
        "fullName": "María López",
        "roleId": 1,
        "roleCode": "TECHNICAL_OWNER",
        "roleName": "Responsable técnico",
        "notes": "Responsable de operación"
      }
    ],
    "technologies": [
      {
        "technologyId": 1,
        "category": "FRONTEND",
        "name": "Angular",
        "version": "21",
        "isPrimary": "Y"
      }
    ],
    "deployments": [
      {
        "deploymentId": 1,
        "environment": "PRODUCTION",
        "url": "https://portal.demo.local"
      }
    ]
  },
  "outgoingDependencies": [
    {
      "dependencyId": 1,
      "dependencyType": {
        "dependencyTypeId": 1,
        "typeCode": "REST_API",
        "typeName": "API REST"
      },
      "dependencyScope": "INTERNAL",
      "criticality": "HIGH",
      "description": "Consulta información de clientes",
      "createdAt": "2026-05-20T10:15:30Z",
      "targetComponent": {
        "componentId": 2,
        "componentType": "API",
        "componentTypeLabel": "API",
        "name": "API Clientes",
        "acronym": "API-C",
        "description": "Servicios de clientes",
        "isActive": "Y",
        "subtype": {
          "type": "API",
          "apiVersion": "v2.4",
          "url": "https://api.demo.local/clientes",
          "protocol": "REST",
          "authenticationMethod": "OAuth 2.0",
          "slaDescription": "99.9% mensual"
        },
        "responsibilities": [],
        "technologies": [],
        "deployments": []
      }
    }
  ]
}
```

`createdAt` es ilustrativo. Si el mock o la fila no tienen valor, se debe devolver `null`.

## 5. Objeto `component`

| Campo | Tipo | Nulable | Origen Oracle |
|---|---|---:|---|
| `componentId` | `number` | No | `catalog_component.component_id` |
| `componentType` | `ComponentType` | No | `catalog_component.component_type` |
| `componentTypeLabel` | `string` | No | Etiqueta calculada según `componentType`. |
| `name` | `string` | No | `catalog_component.name` |
| `acronym` | `string` | Sí | `catalog_component.acronym` |
| `description` | `string` | Sí | `catalog_component.description` |
| `isActive` | `"Y" \| "N"` | No | `catalog_component.is_active` |
| `subtype` | objeto union | Sí | Tabla de detalle según `componentType`. |
| `responsibilities` | `Responsibility[]` | No | Join entre `system_responsibility`, `person` y `responsibility_role`. |
| `technologies` | `Technology[]` | No | Join entre `component_technology` y `technology`. |
| `deployments` | `Deployment[]` | No | `system_deployment`. |

Para `EXTERNAL_SERVICE` o `MESSAGING`, si no existe una tabla de subtipo, devolver:

```json
"subtype": null
```

Los datos `createdAt` y `updatedAt` de `catalog_component` no son necesarios en la tarjeta actual y pueden omitirse.

## 6. Variantes de `subtype`

### 6.1 Sistema

```json
{
  "type": "SYSTEM",
  "businessObjective": "Atender operaciones de clientes por canal digital.",
  "ownerArea": "Experiencia de Cliente",
  "criticality": "HIGH",
  "systemStatus": "ACTIVE",
  "goLiveDate": "2022-05-10",
  "endOfLifeDate": null
}
```

Mapeo:

| JSON | Oracle |
|---|---|
| `businessObjective` | `system_detail.business_objective` |
| `ownerArea` | `system_detail.owner_area` |
| `criticality` | `system_detail.criticality` |
| `systemStatus` | `system_detail.system_status` |
| `goLiveDate` | `system_detail.go_live_date` |
| `endOfLifeDate` | `system_detail.end_of_life_date` |

### 6.2 API

```json
{
  "type": "API",
  "apiVersion": "v2.4",
  "url": "https://api.demo.local/clientes",
  "protocol": "REST",
  "authenticationMethod": "OAuth 2.0",
  "slaDescription": "99.9% mensual"
}
```

Mapeo:

| JSON | Oracle |
|---|---|
| `apiVersion` | `api_detail.api_version` |
| `url` | `api_detail.url` |
| `protocol` | `api_detail.protocol` |
| `authenticationMethod` | `api_detail.authentication_method` |
| `slaDescription` | `api_detail.sla_description` |

### 6.3 Base de datos

```json
{
  "type": "DATABASE",
  "engine": "Oracle Database",
  "engineVersion": "19c",
  "instanceName": "ORCLCLI01",
  "schemaName": "CLIENTES"
}
```

### 6.4 Infraestructura

```json
{
  "type": "INFRASTRUCTURE",
  "hostname": "app-server-01",
  "ipAddress": "10.10.10.25",
  "operatingSystem": "Oracle Linux 9",
  "hostingModel": "ON_PREMISE"
}
```

## 7. Responsables, tecnologías y despliegues

### 7.1 Responsable

```json
{
  "personId": 1,
  "fullName": "María López",
  "roleId": 1,
  "roleCode": "TECHNICAL_OWNER",
  "roleName": "Responsable técnico",
  "notes": "Responsable de operación"
}
```

Una tarjeta puede mostrar más de una asignación. No se debe colapsar una persona que tenga dos roles distintos.

### 7.2 Tecnología

```json
{
  "technologyId": 1,
  "category": "FRONTEND",
  "name": "Angular",
  "version": "21",
  "isPrimary": "Y"
}
```

La vista construye la etiqueta `Angular · 21`; si `version` es `null`, muestra solamente `Angular`.

### 7.3 Despliegue

```json
{
  "deploymentId": 1,
  "environment": "PRODUCTION",
  "url": "https://portal.demo.local"
}
```

La vista construye la etiqueta `PRODUCTION · https://portal.demo.local` y puede traducir el ambiente al presentar la interfaz.

## 8. Dependencia saliente

```json
{
  "dependencyId": 1,
  "dependencyType": {
    "dependencyTypeId": 1,
    "typeCode": "REST_API",
    "typeName": "API REST"
  },
  "dependencyScope": "INTERNAL",
  "criticality": "HIGH",
  "description": "Consulta información de clientes",
  "createdAt": "2026-05-20T10:15:30Z",
  "targetComponent": {
    "componentId": 2,
    "componentType": "API",
    "componentTypeLabel": "API",
    "name": "API Clientes",
    "acronym": "API-C",
    "description": "Servicios de clientes",
    "isActive": "Y",
    "subtype": {},
    "responsibilities": [],
    "technologies": [],
    "deployments": []
  }
}
```

En el objeto anterior, `subtype` es `{}` solamente para abreviar el ejemplo; una respuesta real debe usar una de las variantes definidas en la sección 6 o `null`.

Mapeo:

| JSON | Oracle |
|---|---|
| `dependencyId` | `dependency.dependency_id` |
| `dependencyType` | Join con `dependency_type` |
| `dependencyScope` | `dependency.dependency_scope` |
| `criticality` | `dependency.criticality` |
| `description` | `dependency.description` |
| `createdAt` | `dependency.created_at` |
| `targetComponent` | Componente donde `component_id = target_component_id`, con sus relaciones. |

Las dependencias se filtran por:

```sql
dependency.origin_component_id = :componentId
```

No se deben devolver como hijos las dependencias entrantes.

## 9. Enums admitidos

### `ComponentType`

```text
SYSTEM
API
DATABASE
INFRASTRUCTURE
EXTERNAL_SERVICE
MESSAGING
```

Etiquetas sugeridas para la UI:

| Código | Etiqueta |
|---|---|
| `SYSTEM` | Sistema |
| `API` | API |
| `DATABASE` | Base de datos |
| `INFRASTRUCTURE` | Infraestructura |
| `EXTERNAL_SERVICE` | Servicio externo |
| `MESSAGING` | Mensajería |

### `Criticality`

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### `SystemStatus`

```text
PLANNED
ACTIVE
DEPRECATED
RETIRED
```

### `DependencyScope`

```text
INTERNAL
EXTERNAL
```

### `HostingModel`

```text
CLOUD
ON_PREMISE
```

### `DeploymentEnvironment`

```text
DEVELOPMENT
TEST
QA
STAGING
PRODUCTION
DR
```

## 10. Respuestas de error

### Componente inexistente

```http
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{
  "timestamp": "2026-05-20T10:15:30Z",
  "status": 404,
  "error": "Not Found",
  "message": "No existe el componente con id 999",
  "path": "/sysapi/catalogos/dependency-explorer/components/999"
}
```

### Identificador inválido

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "timestamp": "2026-05-20T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "componentId debe ser un número entero positivo",
  "path": "/sysapi/catalogos/dependency-explorer/components/abc"
}
```

## 11. DTO sugerido para Spring Boot

```java
public record DependencyExplorerOption(
    Long componentId,
    String componentType,
    String componentTypeLabel,
    String name,
    String acronym,
    String isActive
) {}

public record DependencyExplorerResponse(
    ComponentCard component,
    List<OutgoingDependencyCard> outgoingDependencies
) {}

public record ComponentCard(
    Long componentId,
    String componentType,
    String componentTypeLabel,
    String name,
    String acronym,
    String description,
    String isActive,
    Object subtype,
    List<ComponentResponsibility> responsibilities,
    List<ComponentTechnology> technologies,
    List<ComponentDeployment> deployments
) {}

public record OutgoingDependencyCard(
    Long dependencyId,
    DependencyTypeSummary dependencyType,
    String dependencyScope,
    String criticality,
    String description,
    Instant createdAt,
    ComponentCard targetComponent
) {}

public record ComponentResponsibility(
    Long personId,
    String fullName,
    Long roleId,
    String roleCode,
    String roleName,
    String notes
) {}

public record ComponentTechnology(
    Long technologyId,
    String category,
    String name,
    String version,
    String isPrimary
) {}

public record ComponentDeployment(
    Long deploymentId,
    String environment,
    String url
) {}

public record DependencyTypeSummary(
    Long dependencyTypeId,
    String typeCode,
    String typeName
) {}
```

Para `subtype` se recomienda modelarlo con clases concretas y una interfaz o `sealed interface`, en lugar de `Object`, para que el contrato quede validado por tipado y OpenAPI.

## 12. Estrategia de carga desde Oracle

Para cada `componentId`:

1. Consultar `catalog_component`.
2. Consultar la tabla de detalle correspondiente al `component_type`.
3. Consultar responsabilidades para el componente.
4. Consultar tecnologías y despliegues asociados.
5. Consultar `dependency` donde `origin_component_id = componentId`.
6. Resolver `dependency_type`.
7. Construir `targetComponent` para cada destino con el mismo agregado de tarjeta.

Para evitar consultas N+1, se recomienda usar:

- Proyecciones DTO.
- Consultas batch con `IN (:componentIds)`.
- `fetch join` para las relaciones conocidas.
- Carga separada y agrupación por ID en el servicio.

## 13. Detección de ciclos

El backend debe devolver solamente las dependencias directas; no debe devolver un árbol recursivo. El frontend mantendrá el conjunto de IDs presentes en la ruta actual y, al recibir un hijo cuyo `componentId` ya esté en esa ruta, marcará la tarjeta como ciclo y no solicitará sus dependencias.

Reglas:

- La relación `1 -> 2 -> 3 -> 1` genera un ciclo en la cuarta tarjeta.
- Una misma dependencia puede aparecer en otra rama si no forma parte de su ruta actual.
- Una tarjeta marcada como ciclo no debe volver a expandirse.
- El modelo Oracle prohíbe autociclo directo con `origin_component_id <> target_component_id`.

## 14. Consideraciones para Oracle

- Los campos `CLOB` se serializan como `string`.
- `DATE` se serializa como `YYYY-MM-DD`.
- `TIMESTAMP` se serializa como ISO 8601.
- `NUMBER(19)` se serializa como número JSON y se recomienda mapearlo a `Long`.
- `CHAR(1)` se conserva como `"Y"` o `"N"`.
- Si Spring devuelve timestamps con zona configurada, el formato debe ser consistente para todos los endpoints.
- Los valores de enums se devuelven exactamente como están en los `CHECK` del script Oracle.

## 15. Criterios de aceptación

- El endpoint del selector devuelve los cuatro componentes del mock ordenados por nombre.
- `GET .../components/1` devuelve el Portal de clientes como `component`.
- La respuesta del Portal contiene a `María López` y su rol.
- La respuesta del Portal contiene `Angular · 21` como combinación derivable.
- La respuesta del Portal contiene el despliegue de `PRODUCTION`.
- La primera dependencia del Portal apunta a `API Clientes`.
- El detalle del componente API contiene versión, URL, protocolo, autenticación y SLA.
- Expandir `API Clientes` devuelve como destino directo a `Oracle Clientes`.
- Expandir un componente sin dependencias devuelve `outgoingDependencies: []`.
- Ninguna colección obligatoria se devuelve como `null`.
- La API nunca genera recursión de tarjetas dentro de `targetComponent`.
