# Informe final — Setas La Guadalupana

Fecha de auditoría: 23 de julio de 2026

## Resultado general

La aplicación fue instalada, preparada, migrada, sembrada, probada, compilada y ejecutada localmente. Backend y frontend respondieron correctamente durante los smoke tests. No se encontraron vulnerabilidades conocidas en `npm audit` ni secretos reales en los archivos candidatos al commit.

La revisión visual automatizada responsive no pudo ejecutarse porque no había un navegador conectado en la sesión. Sí se verificaron los estilos responsive existentes, el build, la entrega HTTP del frontend y la presencia del logo. No debe interpretarse como aprobación visual en dispositivos reales.

## Funcionalidades completas

- Registro, login, tokens, renovación, cierre, verificación local y recuperación.
- Roles de cliente, administración, contenido y pedidos.
- Catálogo público y productos administrativos.
- Carrito autenticado y sincronización desde el navegador.
- Checkout con recálculo de precios y existencias en el backend.
- Pedidos, historial, detalle, cancelación y reposición de inventario.
- Comprobante HTML imprimible y PDF no fiscal.
- Perfil, direcciones, favoritos, soporte y solicitudes mayoristas.
- Recetas y contenido administrable.
- Panel administrativo, usuarios, roles y auditoría.
- Movimientos de inventario con actor, motivo y referencia.
- Dashboard, estadísticas, reportes, CSV y PDF.
- Páginas 403/404, error boundary, SEO inicial y documentación.

## Funcionalidades simuladas

- Correo mediante `EMAIL_MODE=console`.
- Pago pendiente, contra entrega, transferencia y registro manual.
- Productos, recetas, pedidos, usuarios y datos empresariales demostrativos.
- Archivos en disco local.
- Comprobante que no constituye factura electrónica.

## Funcionalidades pendientes

- Pago real y webhooks.
- Correo transaccional real.
- Facturación electrónica.
- Almacenamiento externo/CDN.
- Dominio definitivo y actualización del sitemap.
- WhatsApp Business, SMS, monitoreo y backups automatizados.
- Textos legales y contenido nutricional revisados.
- Pruebas E2E, mayor cobertura frontend y revisión visual/accesible con navegador.

Consulta `docs/PENDING_FEATURES.md`.

## Ejecuciones realizadas

| Control | Resultado |
| --- | --- |
| `npm install` | Correcto; dependencias al día |
| `npm run prisma:generate` | Correcto, Prisma Client 6.19.3 |
| `npm run migrate` | Correcto, esquema sincronizado |
| `npm run seed` | Correcto: 4 roles, 7 productos, 8 recetas y 4 pedidos base |
| `npm run prisma:validate` | Esquema válido |
| `npm run db:status` | 6 migraciones; base actualizada |
| ESLint | Correcto |
| Prettier | Correcto |
| Frontend tests | 2 aprobadas |
| Backend tests | 39 aprobadas |
| Total | 41 aprobadas, 0 fallidas |
| Build frontend | Correcto |
| `npm audit --audit-level=high` | 0 vulnerabilidades |

## Pruebas de ejecución

- Backend `/api/health`: HTTP 200 y estado `ok`.
- Frontend `/`: HTTP 200 con elemento raíz.
- `/robots.txt`: HTTP 200.
- Login de cliente y administrador: correcto.
- Catálogo: respuesta correcta con productos.
- Carrito: respuesta autenticada correcta.
- Pedidos propios: respuesta autenticada correcta.
- Recetas administrativas: 8 registros.
- Dashboard administrativo: respuesta correcta.
- Inventario y opciones de reportes: respuestas correctas.

Las pruebas automatizadas ejecutaron además registro, recuperación inválida, autorización 401/403, CRUD administrativo, carga segura de archivos, checkout, stock, acceso a pedidos, cancelación, PDF, perfil, direcciones, favoritos, estadísticas y exportaciones.

## Resultado del build

Vite transformó 1725 módulos sin advertencias críticas. La salida separa el sitio público del panel administrativo:

- Paquete principal aproximado: 272 kB antes de gzip.
- Panel administrativo aproximado: 229 kB antes de gzip.

`frontend/dist` se genera localmente y está ignorado por Git.

## Seguridad y archivos

- `.env`, bases SQLite, `node_modules`, `dist`, cobertura, uploads, logs, certificados y `tmp` están ignorados.
- La búsqueda no encontró claves privadas, tokens GitHub, claves OpenAI ni secretos con formato reconocible.
- Las credenciales incluidas son cuentas ficticias de desarrollo usadas por seed y pruebas; deben retirarse antes de producción.
- Los logs locales pueden contener tokens temporales de verificación y no se incluirán.
- La carga de imágenes valida tamaño, extensión, MIME y firma binaria.
- Los pedidos propios se filtran por usuario y los importes se calculan en backend.

## Estado de Git

- Rama: `main`
- Origin: `https://github.com/ellmoi/orellanas-guadalupana.git`
- Repositorio remoto al auditar: vacío, sin ramas ni commits publicados.
- Commit preparado: `feat: plataforma integral de Setas La Guadalupana`
- Push: se ejecutará después de la revisión final del staging, sin `--force`.

## Recomendaciones antes de producción

1. Retirar cuentas y contraseñas demostrativas.
2. Cambiar `JWT_SECRET` y usar un gestor de secretos.
3. Migrar y probar PostgreSQL con backups/restauración.
4. Configurar dominio, HTTPS, CORS y URLs definitivas.
5. Reemplazar `example.com` en robots y sitemap.
6. Integrar correo y almacenamiento sin registrar tokens.
7. Implementar pago real con webhooks firmados e idempotencia.
8. Obtener revisión legal, contable y nutricional.
9. Ejecutar E2E, revisión responsive real y auditoría de accesibilidad.
10. Configurar monitoreo, alertas, retención de logs y respuesta a incidentes.

## Servicios externos necesarios

- PostgreSQL administrado o autogestionado.
- Hosting para frontend y backend.
- Dominio/DNS y HTTPS.
- Correo transaccional.
- Almacenamiento de objetos/CDN.
- Pasarela de pagos habilitada para Colombia.
- Proveedor autorizado de facturación electrónica.
- Monitoreo, alertas y backups.
- Opcionalmente WhatsApp Business y SMS.
