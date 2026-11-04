# Resumen ejecutivo — Catálogo de sistemas, aplicaciones y dependencias

## Propósito

El catálogo propone una fuente central para conocer qué aplicaciones y componentes tecnológicos utiliza la empresa, cómo se relacionan, qué información intercambian y quién es responsable de cada sistema. Su objetivo es mejorar el control del inventario tecnológico, facilitar el análisis de impacto y apoyar decisiones de operación, arquitectura y gobierno.

El modelo relacional de Oracle representa las dependencias como relaciones dirigidas entre componentes: el origen es quien consume o inicia la interacción y el destino es el proveedor o recurso utilizado.

## Información que puede registrar

- **Inventario de componentes:** sistemas, APIs, bases de datos, infraestructura, servicios externos y plataformas de mensajería, con nombre, acrónimo, descripción y estado de actividad.
- **Ficha de sistema:** objetivo de negocio, área propietaria, criticidad, estado del ciclo de vida y fechas de puesta en producción y fin de vida.
- **Servicios y datos técnicos:** versión, URL, protocolo, método de autenticación y SLA de las APIs; motor, versión, instancia y esquema de las bases de datos; hostname, IP, sistema operativo y alojamiento cloud o local de la infraestructura.
- **Ambientes:** URL de despliegue de los sistemas en desarrollo, pruebas, QA, preproducción, producción o recuperación ante desastres.
- **Responsabilidad y contacto:** personas, correo, organización y los roles asignados a cada sistema, por ejemplo, responsable técnico, líder de desarrollo, administrador, dueño de negocio, usuario clave o proveedor externo.
- **Stack tecnológico:** categorías y tecnologías asociadas a un componente, incluyendo versión e indicación de tecnología principal.
- **Dependencias:** componentes de origen y destino, mecanismo de integración (REST, SOAP, base de datos, Kafka, SFTP, ETL, LDAP/AD, webhook, batch, entre otros), alcance interno/externo y criticidad.
- **Flujos de datos:** dato intercambiado, periodicidad, sensibilidad, formato y descripción, asociados a una dependencia.

El esquema usa claves, restricciones de unicidad y validaciones de dominio para reducir referencias inválidas y valores fuera de los catálogos definidos. Por ejemplo, evita que una dependencia conecte un componente consigo mismo y mantiene el tipo correcto para los detalles de sistemas, APIs, bases de datos e infraestructura.

## Preguntas empresariales que puede ayudar a responder

### Inventario y propiedad

- ¿Qué aplicaciones y componentes están registrados, activos, planeados, obsoletos o retirados?
- ¿Cuál es el objetivo de negocio y qué área es propietaria de cada sistema?
- ¿Qué sistemas están clasificados como de alta o crítica importancia?
- ¿Qué aplicaciones carecen de responsable técnico o dueño de negocio asignado?
- ¿Quién debe ser contactado para soporte, administración, decisiones funcionales o escalamiento?
- ¿Qué sistemas dependen de un proveedor externo identificado como responsable?

### Dependencias e impacto

- ¿De qué APIs, bases de datos, servicios o plataformas depende una aplicación?
- ¿Qué aplicaciones y componentes consumen un servicio o componente específico?
- Si una API, base de datos o plataforma deja de estar disponible, ¿qué sistemas podrían verse afectados?
- ¿Qué relaciones son externas, críticas o utilizan un mecanismo determinado, como REST, Kafka o SFTP?
- ¿Qué camino de dependencias conecta una aplicación con un recurso de datos?
- ¿Hay dependencias sin descripción o componentes referenciados que no estén adecuadamente catalogados?

Estas preguntas permiten apoyar un análisis de impacto y priorizar una revisión operativa. El catálogo documenta relaciones; por sí solo no detecta fallas ni calcula disponibilidad, radio real de impacto o tiempos de recuperación.

### Datos, interfaces y arquitectura

- ¿Qué datos se intercambian entre componentes y con qué periodicidad, formato y nivel de sensibilidad?
- ¿Qué APIs están publicadas, qué versión/protocolo usan, cómo declaran autenticarse y qué SLA tienen documentado?
- ¿Qué bases de datos y motores soportan a las aplicaciones?
- ¿Qué lenguajes, frameworks, motores, herramientas de mensajería y versiones forman el stack de un componente?
- ¿Qué sistemas tienen despliegues registrados por ambiente y cuáles son sus URLs?
- ¿Dónde existen componentes con información confidencial o restringida en sus flujos documentados?

### Ciclo de vida y priorización

- ¿Qué sistemas se acercan a su fecha de fin de vida registrada?
- ¿Qué sistemas están planeados, activos, obsoletos o retirados?
- ¿Qué componentes críticos dependen de tecnología o versiones que requieren evaluación?
- ¿Qué servicios y sistemas deberían revisarse antes de un cambio, migración o retiro?

El modelo registra versiones y fechas declaradas, pero no incluye un catálogo de fin de soporte por fabricante ni actualiza automáticamente el estado de ciclo de vida.

## Control de aplicaciones y responsables

El valor de gobierno del catálogo depende de que cada aplicación tenga una ficha identificable y responsables asignados con roles claros. Esto permite pasar de un inventario informal a una vista controlada de:

1. **Qué existe:** identificador común para conectar la ficha de negocio con APIs, datos, infraestructura, tecnología y dependencias.
2. **Quién responde:** personas y roles asociados a cada sistema, incluyendo el ámbito técnico y de negocio.
3. **Qué puede verse afectado:** relaciones dirigidas que ayudan a identificar consumidores y proveedores antes de un cambio o incidente.
4. **Qué debe atenderse primero:** criticidad, sensibilidad de datos y estado del sistema para orientar revisiones y priorización.
5. **Qué tan completo está el registro:** consultas y reportes pueden identificar fichas sin responsables, sin detalle técnico, sin despliegues o con dependencias incompletas.

Para que este control sea efectivo como proceso empresarial, conviene definir un responsable de calidad del dato, exigir actualización al aprobar altas y cambios, revisar periódicamente los responsables y dependencias, y establecer criterios de completitud por criticidad.

## Límites y consideraciones importantes

- **El modelo de datos no equivale a una implementación productiva.** El DDL Oracle define la estructura y sus restricciones; requiere desplegarse y conectarse a una aplicación y procesos empresariales.
- **El prototipo Angular actual es de demostración.** Utiliza registros mock guardados en `localStorage` del navegador y no está conectado a Oracle ni a un backend. No constituye un inventario corporativo compartido o fuente oficial.
- **Las relaciones documentadas dependen de la calidad y actualización de los datos.** No se descubren automáticamente componentes ni integraciones.
- **No es un sistema de monitoreo o gestión de incidentes.** No registra disponibilidad en tiempo real, alertas, eventos, fallas ni causa raíz.
- **No sustituye herramientas de seguridad o cumplimiento.** Registra sensibilidad declarada y método de autenticación de APIs, pero no gestiona secretos, permisos de acceso, vulnerabilidades, controles regulatorios, evaluaciones de riesgo ni evidencias de auditoría.
- **No registra historial de cambios ni aprobaciones.** Los campos de creación no constituyen un registro de auditoría; tampoco se implementan versionado de fichas, aprobaciones o trazabilidad de quién cambió qué.
- **No modela continuidad operativa completa.** RTO y RPO aparecen como recomendaciones para una evolución, pero no están en las tablas actuales. Tampoco se modelan respaldos, redundancia o pruebas de recuperación.
- **La información de proveedor es limitada.** Puede representarse una persona/organización con rol de proveedor externo, pero no hay gestión de contratos, vigencia, contactos del proveedor por servicio ni acuerdos comerciales.

## Recomendación ejecutiva

Adoptar el catálogo como una capacidad de gobierno por etapas: primero consolidar el inventario y asignar responsable técnico y dueño de negocio a cada sistema; luego completar criticidad, ambientes, tecnologías y dependencias; finalmente acordar revisiones periódicas, indicadores de completitud y flujos de aprobación. Antes de considerarlo control corporativo, integrar el prototipo con Oracle mediante un backend seguro y añadir autenticación/autorización empresarial, auditoría de cambios, validación referencial del flujo de datos y continuidad operativa según las prioridades de la organización.

## Referencias

- [Definición Oracle del catálogo](./oracle_catalogo_sistemas_dependencias.sql)
- [Modelo entidad-relación](./modelo_entidad_relacion_oracle.md)
- [Prototipo Angular APPNG](./APPNG/README.md)
