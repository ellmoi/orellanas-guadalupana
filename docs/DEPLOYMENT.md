# Despliegue

Esta guía describe alternativas; no obliga a contratar servicios. Los precios, límites, regiones y condiciones de los planes gratuitos pueden cambiar y deben verificarse antes de publicar.

## Arquitectura sugerida

1. Frontend estático en un servicio con plan gratuito disponible.
2. Backend Node.js en un servicio con plan gratuito disponible.
3. PostgreSQL administrado con plan gratuito disponible.
4. Almacenamiento externo opcional para imágenes.
5. Proveedor de correo cuando se requiera entrega real.

Un subdominio gratuito del proveedor permite pruebas. Un dominio propio es opcional y normalmente tiene costo.

## Preparación

```bash
npm install
npm run prisma:generate
npm run check
```

El frontend se genera con `npm run build` en `frontend/dist`. El backend se inicia con `npm run start --workspace backend`.

## Variables

Backend:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL` de PostgreSQL
- `JWT_SECRET` aleatorio y privado
- `JWT_EXPIRES_IN`
- `REFRESH_EXPIRES_IN_DAYS`
- `FRONTEND_URL` con HTTPS
- `EMAIL_MODE` y variables del proveedor futuro
- `UPLOAD_MAX_SIZE`

Frontend:

- `VITE_API_URL=https://api.ejemplo.com/api`

Las variables `VITE_*` se incorporan durante el build y no deben contener secretos.

## Migraciones y seed seguro

Genera el cliente y ejecuta migraciones de producción mediante el flujo recomendado por la versión instalada de Prisma. Haz backup y prueba restauración antes.

No ejecutes el seed demostrativo sin modificarlo: contiene cuentas conocidas, datos ficticios y marcadores comerciales.

## CORS y HTTPS

- `FRONTEND_URL` debe coincidir exactamente con el origen público.
- Permite solo orígenes necesarios.
- Frontend y backend deben usar HTTPS.
- Activa redirección HTTP→HTTPS en el proveedor.
- No mezcles contenido HTTP en páginas HTTPS.

## Dominio

Se puede empezar con subdominios gratuitos del proveedor. Si se compra dominio propio:

1. Configura DNS.
2. Vincula frontend y, si aplica, un subdominio para el API.
3. Actualiza `VITE_API_URL`, `FRONTEND_URL`, enlaces de correo, Open Graph, `robots.txt` y sitemap.
4. Espera la propagación y valida HTTPS.

## Archivos

`backend/uploads` sirve solo para desarrollo. Muchos servicios gratuitos tienen disco efímero. Antes de producción:

- Selecciona almacenamiento de objetos.
- Guarda URLs en la base.
- Valida MIME, firma y tamaño.
- Define eliminación de objetos huérfanos.
- Considera URLs firmadas para archivos privados.

## Correo

`EMAIL_MODE=console` no entrega mensajes. Para correo real:

- Verifica dominio/remitente.
- Configura credenciales como secretos.
- Evita registrar tokens completos.
- Prueba rebotes, expiración y límites.
- Añade una política de privacidad y consentimiento cuando corresponda.

## Comprobación posterior

- `/api/health` responde.
- Registro, ingreso y permisos funcionan.
- El frontend consume la URL pública correcta.
- Migraciones están aplicadas.
- No existen cuentas o contraseñas demostrativas.
- Los comprobantes dicen que no son factura electrónica.
- Backups, logs y alertas están operativos.
