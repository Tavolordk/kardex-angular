# Acceso por red Ethernet y proxy de API

El proyecto queda configurado para escuchar en todas las interfaces de red mediante `0.0.0.0` en el puerto `4205`.

## Levantar el frontend

```powershell
npm install
npm start
```

Desde la misma computadora:

```text
http://localhost:4205/
```

Desde otra computadora o dispositivo conectado a la misma red Ethernet:

```text
http://IP_DE_ESTA_PC:4205/
```

En Windows puedes obtener la IPv4 con:

```powershell
ipconfig
```

Busca la dirección **IPv4** del adaptador Ethernet, por ejemplo `192.168.1.35`. En ese caso los demás equipos abrirían:

```text
http://192.168.1.35:4205/
```

## Proxy de API

Las llamadas del frontend deben usar rutas relativas, por ejemplo:

```text
/api/usuarios
/api/solicitudes
```

El servidor de desarrollo Angular redirige `/api/*` al backend configurado en `API_PROXY_TARGET`.

Por defecto el destino es:

```text
http://127.0.0.1:8080
```

Si tu backend usa otro puerto o dirección, define la variable antes de iniciar Angular.

PowerShell:

```powershell
$env:API_PROXY_TARGET="http://127.0.0.1:5000"
npm start
```

CMD:

```cmd
set API_PROXY_TARGET=http://127.0.0.1:5000
npm start
```

También se agregó proxy WebSocket para `/hubs/*`, útil si después se consume SignalR/WebSocket desde el mismo host.

## Firewall de Windows

Si otra PC no puede abrir el sitio aunque ambas estén en la misma red, permite conexiones TCP entrantes al puerto 4205 en el Firewall de Windows, preferentemente solo para el perfil de red privada.

Ejecutando PowerShell como administrador:

```powershell
New-NetFirewallRule -DisplayName "Angular Kardex 4205" -Direction Inbound -Protocol TCP -LocalPort 4205 -Action Allow -Profile Private
```

Para eliminar después esa regla:

```powershell
Remove-NetFirewallRule -DisplayName "Angular Kardex 4205"
```
