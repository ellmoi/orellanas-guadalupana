# Seguridad

## Alcance actual

- Contraseñas con bcrypt.
- Tokens JWT de acceso y renovación.
- Sesiones de renovación persistidas, rotadas y revocables.
- Roles y autorización aplicados en el backend.
- Helmet, CORS explícito y rate limiting.
- Validación y sanitización de solicitudes.
- Prisma para acceso parametrizado a datos.
- Auditoría de acciones sensibles.
- Archivos con nombre aleatorio, tamaño máximo, tipos permitidos y firma binaria.
- Respuestas de error sin detalles internos.

## Autenticación y sesiones

- Nunca registres contraseñas o tokens.
- Usa un `JWT_SECRET` largo, aleatorio y diferente por ambiente.
- HTTPS es obligatorio en producción.
- Revoca sesiones al restablecer o cambiar contraseña.
- Considera cookies `HttpOnly`, protección CSRF y MFA administrativo como evolución de producción.

## Autorización

La interfaz puede ocultar opciones, pero la seguridad depende de:

- `authenticate` para identificar al usuario.
- `requireRole` y permisos administrativos.
- Consultas por `userId` para pedidos, direcciones y recursos propios.
- Restricción del cambio de roles a administradores.
- Auditoría de roles, estados, inventario y pagos manuales.

Las pruebas cubren accesos 401/403, pedidos ajenos y cambio de roles.

## Validación e inyección

- `express-validator` valida cuerpos, parámetros y consultas sensibles.
- Se eliminan claves peligrosas como `__proto__`.
- Prisma evita SQL construido manualmente.
- Los importes y existencias se vuelven a consultar y calcular en el servidor.
- No renderices HTML de usuarios sin sanitización.

## Archivos

Se aceptan JPG, PNG y WebP dentro de `UPLOAD_MAX_SIZE`. Se verifican extensión, MIME y firma binaria. Producción debe añadir:

- Almacenamiento externo.
- Escaneo adicional si el riesgo lo requiere.
- Procesamiento aislado.
- Política de retención y eliminación.
- URLs firmadas para contenido privado.

## Logs y datos personales

Morgan se usa en desarrollo. `EMAIL_MODE=console` imprime enlaces con tokens temporales; por ello:

- `logs/` está ignorado.
- No compartas logs de desarrollo.
- No habilites ese modo en producción.
- Redacta tokens, identificadores innecesarios y datos personales.
- Define retención y acceso mínimo.

## Secretos y archivos excluidos

`.gitignore` excluye `.env`, bases locales, logs, cargas, certificados y dependencias. Antes de publicar:

1. Inspecciona el historial del repositorio.
2. Rota cualquier secreto expuesto.
3. Elimina cuentas demostrativas.
4. Ejecuta `npm audit` y `npm run check`.
5. Comprueba que el build no contiene secretos.

## Reporte de vulnerabilidades

Marcador editable: `[CORREO O CANAL PRIVADO DE SEGURIDAD]`.

No publiques detalles explotables en canales abiertos antes de que exista una corrección.

## Lista de producción

- HTTPS y HSTS efectivos.
- CORS exacto.
- Secreto JWT rotado.
- Base y backups cifrados.
- MFA administrativo evaluado.
- Rate limits ajustados con tráfico real.
- Dependencias sin vulnerabilidades conocidas críticas/altas.
- Alertas para errores, abuso y accesos administrativos.
- Políticas legales y de privacidad aprobadas.
