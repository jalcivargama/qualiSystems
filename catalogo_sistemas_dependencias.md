# Conversación: Catálogo de Sistemas y Dependencias

## Solicitud
El usuario desea un sistema para almacenar información de los sistemas informáticos de una compañía, incluyendo:

- Stack tecnológico.
- Dependencias internas y externas.
- Bases de datos y APIs.
- Responsables de mantenimiento.
- Dueños y operadores.
- Tipo de interacción entre sistemas.
- Capacidad de construir un árbol de dependencias a partir de un sistema seleccionado.

## Recomendaciones

### Entidad Sistema
Campos sugeridos:
- ID Sistema
- Nombre
- Acrónimo
- Descripción
- Objetivo de negocio
- Área propietaria
- Criticidad
- Estado
- Fechas relevantes
- URL y ambiente

### Arquitectura y Stack Tecnológico
- Lenguaje principal
- Framework
- Base de datos
- Frontend
- Backend
- Mensajería
- Contenedores
- Orquestación
- Monitoreo

### Personas y Responsabilidades
- Responsable técnico
- Líder de desarrollo
- Administrador
- Dueño de negocio
- Usuario clave
- Proveedor externo

### Dependencias
Entidad central para relacionar componentes:
- Sistema origen
- Sistema destino
- Tipo de dependencia
- Criticidad
- Dirección del flujo

Tipos de dependencia:
- API REST
- SOAP
- Base de datos
- Kafka
- RabbitMQ
- FTP/SFTP
- ETL
- LDAP/AD
- Webhook
- Batch

### Bases de Datos
Entidad independiente con:
- Nombre
- Motor
- Versión
- Instancia
- Esquema
- Responsable

### APIs
Entidad independiente con:
- Nombre
- Versión
- URL
- Protocolo
- Autenticación
- SLA

### Infraestructura
- Hostname
- IP
- Sistema Operativo
- Cloud / On-Premise

### Flujos de Datos
- Dato intercambiado
- Sistema origen
- Sistema destino
- Periodicidad
- Sensibilidad
- Formato

## Modelo Recomendado

Se recomendó utilizar un modelo de **grafo dirigido** para representar dependencias.

Ejemplo:

```text
Portal Web
    |
    +--> API Clientes
    |         |
    |         +--> Oracle Clientes
    |         +--> Kafka
    |
    +--> API Pagos
              |
              +--> Oracle Pagos
              +--> API SAT
```

Esto permite analizar:

- Dependencias directas.
- Dependencias inversas.
- Impacto de fallas.
- Sistemas consumidores y proveedores.

## Modelo de Datos

El modelo relacional conserva los componentes catalogados y representa las
relaciones como un grafo dirigido. Los archivos SQL de esta especificación son:

- [Script PostgreSQL](./postgresql_catalogo_sistemas_dependencias.sql)
- [Script Oracle](./oracle_catalogo_sistemas_dependencias.sql)
- [Modelo entidad-relación Oracle](./modelo_entidad_relacion_oracle.md)

### Entidades y relaciones

```text
CATALOG_COMPONENT 1---0..1 SYSTEM_DETAIL
        |          1---0..1 API_DETAIL
        |          1---0..1 DATABASE_DETAIL
        |          1---0..1 INFRASTRUCTURE_DETAIL
        |          1---N COMPONENT_TECHNOLOGY N---1 TECHNOLOGY
        |          1---N SYSTEM_RESPONSIBILITY N---1 PERSON
        |                                      N---1 RESPONSIBILITY_ROLE
        |
        +---N DEPENDENCY (como origen)
        +---N DEPENDENCY (como destino)
                    1---N DATA_FLOW

CATALOG_COMPONENT 1---N SYSTEM_DEPLOYMENT
```

`CATALOG_COMPONENT` es el nodo común del grafo: cada sistema, API, base de
datos, infraestructura, servicio externo o plataforma de mensajería tiene un
identificador único. Las tablas de detalle contienen los atributos propios de
cada clase de componente. Para mantener la integridad semántica, cada registro
de detalle debe corresponder a un componente del tipo indicado en
`COMPONENT_TYPE`.

`DEPENDENCY` es una arista dirigida desde el componente consumidor/origen hacia
el proveedor/destino. Su tipo describe el mecanismo de integración; su alcance
indica si es interno o externo. `DATA_FLOW` permite documentar los datos
intercambiados por una dependencia. `SYSTEM_DEPLOYMENT` permite registrar URL
por ambiente. Las tecnologías se asocian a los componentes para describir el
stack, y las responsabilidades relacionan personas con sistemas mediante un
rol.

### Tablas

| Tabla | Propósito |
|---|---|
| `CATALOG_COMPONENT` | Identidad, nombre, acrónimo, descripción y tipo de cada nodo del catálogo. |
| `SYSTEM_DETAIL` | Objetivo de negocio, área propietaria, criticidad, estado y fechas del sistema. |
| `API_DETAIL` | Versión, URL, protocolo, autenticación y SLA de una API. |
| `DATABASE_DETAIL` | Motor, versión, instancia y esquema de una base de datos. |
| `INFRASTRUCTURE_DETAIL` | Host, IP, sistema operativo y modalidad cloud/on-premise. |
| `SYSTEM_DEPLOYMENT` | URL de un sistema por ambiente. |
| `PERSON`, `RESPONSIBILITY_ROLE`, `SYSTEM_RESPONSIBILITY` | Personas y sus roles/responsabilidades por sistema. |
| `TECHNOLOGY`, `COMPONENT_TECHNOLOGY` | Catálogo de tecnologías y stack por componente, incluyendo versión. |
| `DEPENDENCY_TYPE`, `DEPENDENCY` | Catálogo de mecanismos y relaciones dirigidas entre componentes. |
| `DATA_FLOW` | Datos, periodicidad, sensibilidad y formato asociados a una dependencia. |

Las restricciones y los tipos SQL se adaptan a cada motor. El script Oracle
requiere Oracle Database 12c o posterior por el uso de columnas identity. Los
scripts crean las tablas, índices, claves y catálogos iniciales; ejecútese cada
uno una sola vez sobre un esquema vacío.

## Campos Avanzados Recomendados

- SLA
- RTO
- RPO
- Licencias
- Costos
- Proveedor
- Versión
- Fin de soporte
- Clasificación de datos
- Cumplimiento regulatorio

## Recomendación Final

Utilizar una base relacional para el catálogo maestro y una base orientada a grafos (por ejemplo Neo4j) para las relaciones y dependencias. Esto facilita la generación de árboles de dependencia, análisis de impacto y mapas de arquitectura empresarial.
