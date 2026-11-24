# Guia de instalacion, ejecucion y despliegue

## 1. Alcance

La aplicacion se encuentra en [APPNG](APPNG) y utiliza Angular 21.
Es un prototipo que se ejecuta en el navegador: no incluye backend, servicios Java,
conexion a Oracle ni autenticacion real. Los datos y la sesion se almacenan en
`localStorage`.

Se puede publicar como sitio estatico o como un WAR con archivos estaticos para un
contenedor web Java. Empaquetarla como WAR **no la convierte en una aplicacion Java
ni agrega servicios de servidor**.

Los comandos de esta guia estan escritos para **PowerShell en Windows**. Se utiliza
`C:\src\qualiSystems` como ruta de ejemplo; ajustarla si el repositorio esta en otro lugar.

## 2. Instalar los requisitos

En la computadora donde se instalara y compilara el proyecto:

| Herramienta | Requisito |
| --- | --- |
| Git | Para descargar el repositorio. |
| Node.js | Se recomienda Node.js 24 LTS. Angular 21 admite las ramas 20 desde 20.19, 22 desde 22.12 y 24 o superior, segun sus requisitos de version. No asumir que cualquier version intermedia es compatible. |
| npm | El proyecto declara `npm@11.19.0`. Usar esa version para reproducir el entorno. |
| Navegador | Un navegador moderno con JavaScript y almacenamiento local habilitados. |
| JDK | Requerido por Maven al empaquetar el WAR. Por ejemplo, JDK 21. |
| Maven 3.x | Empaqueta el frontend Angular como WAR para WebLogic (`mvn clean package`). |
| Servidor web Java | WebLogic para el WAR generado. La version debe ser compatible con el descriptor (`12.2.1.3.0`). |

Descargar Git desde <https://git-scm.com/downloads/win> y Node.js desde
<https://nodejs.org/>. Para el JDK puede utilizarse <https://adoptium.net/>.
Despues de instalar, abrir una nueva terminal para cargar los cambios de `PATH`.

Comprobar las herramientas:

```powershell
git --version
node --version
npm --version
```

Si es necesario ajustar npm, ejecutar:

```powershell
npm install --global npm@11.19.0
```

No se necesita instalar Angular CLI globalmente: los scripts de npm utilizan la
version local declarada por el proyecto.

## 3. Descargar e instalar la aplicacion

Si todavia no se dispone del repositorio:

```powershell
New-Item -ItemType Directory -Force -Path C:\src | Out-Null
Set-Location C:\src
git clone https://github.com/jalcivargama/qualiSystems.git
```

Instalar las dependencias desde el directorio de la aplicacion:

```powershell
Set-Location C:\src\qualiSystems\APPNG
npm ci
```

`npm ci` utiliza [package-lock.json](APPNG/package-lock.json), instala las versiones
bloqueadas y reemplaza `node_modules` si ya existe. Si informa diferencias entre el
manifiesto y el lockfile, corregir esa inconsistencia antes de continuar; no borrar
el lockfile para ocultar el error.

No es necesario ejecutar los scripts SQL ni configurar una base de datos para
utilizar este prototipo.

## 4. Ejecutar en local

```powershell
Set-Location C:\src\qualiSystems\APPNG
npm start
```

Abrir <http://localhost:4200>. Para detener el servidor, presionar `Ctrl+C` en
la terminal.

Si el puerto esta ocupado:

```powershell
npm start -- --port 4300
```

En ese caso, abrir <http://localhost:4300>.

### Acceso de demostracion

- Usuario: `admin`
- Clave: `Admin123!`

Estas credenciales corresponden a una simulacion, no a un mecanismo de seguridad.
No exponer el prototipo como un sistema productivo con informacion sensible.
Los cambios solo existen en el navegador utilizado; no se comparten entre usuarios
ni se guardan en una base de datos.

### Pruebas opcionales

```powershell
Set-Location C:\src\qualiSystems\APPNG
npm test -- --watch=false
```

## 5. Compilar para despliegue estatico

### Publicacion en la raiz del sitio

Por ejemplo, `https://servidor/`:

```powershell
Set-Location C:\src\qualiSystems\APPNG
npm run build -- --configuration production
```

Con la configuracion actual, los archivos publicables quedan en:

```text
C:\src\qualiSystems\APPNG\dist\APPNG\browser
```

La carpeta `browser` contiene `index.html`, JavaScript, CSS, imagenes y otros
recursos. Publicar **su contenido**, no la carpeta contenedora `dist`.
No subir `node_modules`, el codigo fuente ni las carpetas de cache.

### Publicacion en una subruta

Por ejemplo, `https://servidor/qualiSystems/`:

```powershell
Set-Location C:\src\qualiSystems\APPNG
npm run build -- --configuration production --base-href /qualiSystems/
```

La barra final de `/qualiSystems/` es necesaria. La ruta debe coincidir con la
ubicacion real de publicacion; cambiarla requiere volver a compilar.

### Configuracion del servidor estatico

Se puede utilizar IIS, Nginx, Apache HTTP Server u otro servidor de archivos.
Node.js y npm solo se necesitan para construir la aplicacion, no para servir el
resultado.

El servidor debe:

1. Servir `index.html` como documento inicial y los recursos con sus tipos MIME correctos.
2. Entregar `index.html` mediante una reescritura interna para las rutas de Angular,
   como `/dashboard`, `/login`, `/explorador-dependencias` y `/catalogos/COMPONENT`.
   Si se publica bajo una subruta, conservar ese prefijo.
3. Servir normalmente los archivos existentes. No convertir solicitudes de recursos
   inexistentes, como archivos `.js`, en respuestas HTML.
4. Permitir actualizar `index.html` sin mantener una copia obsoleta en cache.
   Los recursos con hash pueden utilizar cache prolongada.

No basta con redirigir cualquier error 404 a una pagina HTML: las rutas validas de
la SPA deben responder correctamente, idealmente con estado HTTP 200.
La regla concreta depende del servidor. `npm start` es un servidor de desarrollo,
no una alternativa de despliegue productivo.

## 6. Compilar y empaquetar un WAR (WebLogic)

### 6.1. Requisitos y contexto

El empaquetado oficial sigue el mismo patron que QColision / Qualitas Gruas:
Angular genera el estatico y Maven produce `deployments/qualiSystems.war`
con `war/web.xml` y `war/weblogic.xml` (context-root `qualiSystems`).

Requisitos adicionales:

| Herramienta | Uso |
| --- | --- |
| Maven 3.x | `mvn clean package` |
| Node.js / npm | El POM ejecuta `npm install` y `npm run build` |

Verificar:

```powershell
java -version
mvn -version
node --version
npm --version
```

### 6.2. Generar el WAR

Desde `APPNG`:

```powershell
Set-Location C:\src\qualiSystems\APPNG
npm install
mvn clean package
```

Salida:

```text
C:\src\qualiSystems\APPNG\deployments\qualiSystems.war
```

Perfiles:

```powershell
mvn clean package -Pprod   # production → environment.prod.ts (por defecto)
mvn clean package -Pqa     # qa → environment.qa.ts
```

URL esperada tras desplegar en WebLogic:

```text
https://host/qualiSystems/
```

Detalle de configuracion (`pom.xml`, `angular.json`, `war/`): ver [APPNG/README.md](APPNG/README.md).

### 6.3. Desplegar

Desplegar `deployments/qualiSystems.war` en WebLogic con el procedimiento del
entorno. El `context-root` queda definido en `war/weblogic.xml` como
`qualiSystems`. El `web.xml` redirige 404 a `/index.html` para soportar el
enrutado SPA (`PathLocationStrategy`).

No renombrar un WAR compilado para `/qualiSystems/` esperando que funcione en
`/`: el `baseHref` y el `context-root` deben coincidir.

## 7. Verificacion posterior al despliegue

1. Abrir la URL inicial y comprobar que cargan estilos, imagenes y scripts.
2. Iniciar sesion con el acceso de demostracion.
3. Navegar al dashboard, un catalogo y el explorador de dependencias.
4. Recargar cada ruta interna y abrirla tambien en una pestana nueva.
   Una sesion nueva puede redirigir al login; no debe aparecer un 404 del servidor.
5. En las herramientas del navegador, revisar que los recursos no devuelvan
   errores 404 ni HTML en lugar de JavaScript o CSS.
6. Confirmar que el documento de una ruta valida responde con HTTP 200.

## 8. Problemas frecuentes

| Sintoma | Revision |
| --- | --- |
| `node`, `npm` o `mvn` no se reconocen | Revisar instalacion y `PATH`; abrir una terminal nueva. Maven requiere JDK. |
| PowerShell bloquea `npm.ps1` | Utilizar `npm.cmd` en lugar de `npm`; no es necesario cambiar la politica de ejecucion global. |
| Error de version de Node.js | Utilizar una rama compatible; se recomienda Node.js 24 LTS con npm 11.19.0. |
| Puerto 4200 ocupado | Ejecutar `npm start -- --port 4300`. |
| Pagina vacia o recursos con 404 | Comprobar que `baseHref` (`/qualiSystems/`) coincide con el `context-root` publicado. |
| Funciona al navegar, pero falla al recargar | Revisar el `error-page` 404 → `/index.html` en `war/web.xml`. |
| El servidor rechaza el WAR | Revisar logs de WebLogic y la version declarada en `war/weblogic.xml`. |
| La compilacion supera los presupuestos | Revisar los mensajes y optimizar los recursos; los limites estan en [angular.json](APPNG/angular.json). No ignorar el fallo. |
| Los datos no aparecen en otro navegador | Es el comportamiento actual: se guardan en `localStorage`, no en un backend. |

Para restablecer los datos de demostracion, eliminar las claves `appng.mock.*`
y `TOKEN` desde el almacenamiento local en las herramientas del
navegador. Esto elimina los cambios guardados localmente.
