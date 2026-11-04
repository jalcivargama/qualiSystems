# Qualitas Systems — catálogo de arquitectura

Prototipo navegable creado con Angular 21 standalone. Incluye inicio de sesión de demostración, un dashboard y operaciones CRUD mock para cada una de las 14 tablas definidas en [`..\oracle_catalogo_sistemas_dependencias.sql`](../oracle_catalogo_sistemas_dependencias.sql).

## Ejecutar

Requiere Node.js compatible con Angular 21 (Node.js 20.19 o posterior).

```powershell
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

## Acceso de demostración

- Usuario: `admin`
- Contraseña: `Admin123!`

El login es solamente una simulación del prototipo, no un control de acceso seguro. La sesión y los cambios CRUD se guardan en `localStorage`; no existe conexión a Oracle ni a un backend. Los datos pueden restablecerse eliminando las claves `appng.mock.*` y `appng.mock.session` del almacenamiento local del navegador.

## Catálogos incluidos

`CATALOG_COMPONENT`, `SYSTEM_DETAIL`, `API_DETAIL`, `DATABASE_DETAIL`, `INFRASTRUCTURE_DETAIL`, `SYSTEM_DEPLOYMENT`, `PERSON`, `RESPONSIBILITY_ROLE`, `SYSTEM_RESPONSIBILITY`, `TECHNOLOGY`, `COMPONENT_TECHNOLOGY`, `DEPENDENCY_TYPE`, `DEPENDENCY` y `DATA_FLOW`.

Las relaciones del prototipo utilizan identificadores de muestra; no validan las claves foráneas de Oracle. Los formularios, búsqueda, altas, edición y eliminación permiten recorrer los flujos de interfaz con datos de demostración.

El menú **Inicio → Explorar dependencias** abre un árbol navegable desde cualquier componente. Las relaciones se recorren desde el origen hacia el destino; cada tarjeta presenta el detalle de subtipo disponible, responsables y roles, stack y despliegues. Los ciclos se identifican y se detienen para evitar recursión infinita.
