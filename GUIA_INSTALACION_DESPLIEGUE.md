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
| JDK | Solo para empaquetar el WAR con `jar`. Por ejemplo, JDK 21. |
| Servidor web Java | Solo para desplegar el WAR. La version de Java debe ser compatible con el servidor elegido. |

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

## 6. Compilar y empaquetar un WAR

### 6.1. Requisitos y contexto

Verificar que el JDK incluya `jar` y este accesible desde la terminal:

```powershell
java -version
jar --version
```

El ejemplo genera `qualiSystems.war` para publicarse en `/qualiSystems/`.
En Tomcat, el nombre del archivo determina normalmente ese contexto.
Si el administrador asigna un contexto diferente, ajustar `--base-href` antes
de compilar.

El ejemplo de rutas siguiente es **especifico de Apache Tomcat 9 o posterior**.
En otros servidores, confirmar la compatibilidad con aplicaciones web estaticas
y configurar su mecanismo equivalente de reescritura SPA. La configuracion de
Tomcat no es portable a todos los servidores que aceptan WAR.
Referencia: [documentacion oficial de RewriteValve](https://tomcat.apache.org/tomcat-9.0-doc/rewrite.html).

### 6.2. Generar los archivos y el paquete

Ejecutar este bloque completo desde PowerShell. Se utiliza una salida separada
para no mezclar la compilacion estandar con la destinada al WAR.

```powershell
Set-Location C:\src\qualiSystems\APPNG
$ErrorActionPreference = 'Stop'

npm run build -- --configuration production --base-href /qualiSystems/ --output-path .\dist\war
if ($LASTEXITCODE -ne 0) { throw 'Fallo la compilacion para WAR.' }

$webRoot = Join-Path (Get-Location).Path 'dist\war\browser'
if (-not (Test-Path -LiteralPath (Join-Path $webRoot 'index.html'))) {
    throw 'No se encontro index.html en la salida de compilacion.'
}

$webInf = Join-Path $webRoot 'WEB-INF'
$metaInf = Join-Path $webRoot 'META-INF'
New-Item -ItemType Directory -Force -Path $webInf, $metaInf | Out-Null

@'
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee https://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">
  <welcome-file-list>
    <welcome-file>index.html</welcome-file>
  </welcome-file-list>
</web-app>
'@ | Set-Content -LiteralPath (Join-Path $webInf 'web.xml') -Encoding UTF8

@'
<?xml version="1.0" encoding="UTF-8"?>
<Context>
  <Valve className="org.apache.catalina.valves.rewrite.RewriteValve" />
</Context>
'@ | Set-Content -LiteralPath (Join-Path $metaInf 'context.xml') -Encoding UTF8

@'
RewriteRule ^/(login|dashboard|explorador-dependencias|catalogos(/[^/]+)?)/?$ /index.html [L]
'@ | Set-Content -LiteralPath (Join-Path $webInf 'rewrite.config') -Encoding ASCII

$war = Join-Path (Get-Location).Path 'dist\qualiSystems.war'
jar --create --file $war -C $webRoot .
if ($LASTEXITCODE -ne 0) { throw 'Fallo el empaquetado del WAR.' }

jar --list --file $war
if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer el WAR generado.' }
```

El resultado es:

```text
C:\src\qualiSystems\APPNG\dist\qualiSystems.war
```

Dentro del WAR, `index.html` debe estar en la raiz, junto con los recursos de
Angular, `WEB-INF\web.xml`, `WEB-INF\rewrite.config` y `META-INF\context.xml`.
No debe quedar anidado bajo `browser` ni bajo `dist`.

La regla de Tomcat cubre las rutas actuales de
[app.routes.ts](APPNG/src/app/app.routes.ts), sin reescribir los recursos estaticos.
Si se agregan rutas, actualizar la regla y regenerar el paquete. Las rutas
desconocidas solicitadas directamente al servidor conservaran su respuesta 404.

### 6.3. Desplegar en Tomcat

Con Tomcat instalado y configurado, establecer la ruta real de su instancia y
copiar el WAR:

```powershell
$tomcatBase = 'C:\servidores\apache-tomcat'
Copy-Item -LiteralPath C:\src\qualiSystems\APPNG\dist\qualiSystems.war `
    -Destination (Join-Path $tomcatBase 'webapps\qualiSystems.war')
```

Iniciar o reiniciar la instancia con el procedimiento autorizado del entorno.
La copia a `webapps` requiere que el `Host` permita despliegue automatico; si no,
utilizar Tomcat Manager o el mecanismo indicado por el administrador.

Si el servidor escucha en el puerto 8080, abrir:

<http://localhost:8080/qualiSystems/>

La configuracion embebida de `META-INF\context.xml` requiere que Tomcat permita
procesar el descriptor de contexto (`deployXML`). Si esta deshabilitado, el
administrador debe configurar la `RewriteValve` en el contexto externo de la
aplicacion; no deshabilitar restricciones del servidor sin autorizacion.
Revisar los logs de Tomcat ante errores de despliegue o de reescritura.

Para desplegar en la raiz con Tomcat, compilar con `--base-href /`, empaquetar como
`ROOT.war` y coordinar el reemplazo del contexto raiz existente. No renombrar un
WAR compilado para `/qualiSystems/` esperando que funcione en `/`.

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
| `node`, `npm` o `jar` no se reconocen | Revisar instalacion y `PATH`; abrir una terminal nueva. `jar` requiere JDK, no solo JRE. |
| PowerShell bloquea `npm.ps1` | Utilizar `npm.cmd` en lugar de `npm`; no es necesario cambiar la politica de ejecucion global. |
| Error de version de Node.js | Utilizar una rama compatible; se recomienda Node.js 24 LTS con npm 11.19.0. |
| Puerto 4200 ocupado | Ejecutar `npm start -- --port 4300`. |
| Pagina vacia o recursos con 404 | Comprobar que `base-href` coincide exactamente con el contexto publicado. |
| Funciona al navegar, pero falla al recargar | Revisar la reescritura SPA y, en Tomcat, la activacion de `RewriteValve`. |
| El servidor rechaza el WAR | Revisar logs, version Java/servidor y compatibilidad del descriptor. Otros servidores pueden requerir configuracion propia. |
| La compilacion supera los presupuestos | Revisar los mensajes y optimizar los recursos; los limites estan en [angular.json](APPNG/angular.json). No ignorar el fallo. |
| Los datos no aparecen en otro navegador | Es el comportamiento actual: se guardan en `localStorage`, no en un backend. |

Para restablecer los datos de demostracion, eliminar las claves `appng.mock.*`
y `TOKEN` desde el almacenamiento local en las herramientas del
navegador. Esto elimina los cambios guardados localmente.
