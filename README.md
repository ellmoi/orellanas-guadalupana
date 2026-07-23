# Setas La Guadalupana

Plataforma web de comercio electrónico para una empresa familiar dedicada al cultivo y venta de orellanas frescas para hogares, restaurantes y compradores mayoristas.

> El contenido comercial, nutricional, legal y empresarial incluido inicialmente es demostrativo y deberá reemplazarse o verificarse antes de la publicación oficial.

<p align="center">
  <img src="./logo-setas-la-guadalupana.png" alt="Logo de Setas La Guadalupana con tres orellanas" width="220">
</p>

## Descripción

Setas La Guadalupana reúne en una sola aplicación el catálogo, carrito, pedidos, solicitudes mayoristas, cuenta del cliente y operación administrativa de una empresa familiar colombiana. El proyecto permite ensayar localmente la venta y gestión de orellanas sin contratar inicialmente pagos, correo o almacenamiento externo.

## Problema que resuelve

Centraliza información y procesos que normalmente quedarían repartidos entre mensajes, hojas de cálculo y registros manuales: productos disponibles, existencias, pedidos, clientes, solicitudes comerciales, comprobantes y reportes. Los totales y permisos se validan en el servidor para reducir errores operativos.

## Clientes

- Hogares y compradores minoristas.
- Restaurantes y negocios gastronómicos.
- Compradores mayoristas y distribuidores.
- Personal de contenido, pedidos e inventario.
- Administradores de la plataforma.

## Funcionalidades

- Registro, verificación local, ingreso, renovación de sesión y recuperación de contraseña.
- Roles `CLIENT`, `ADMIN`, `CONTENT_EDITOR` y `ORDER_MANAGER`.
- Catálogo, carrito persistente, checkout local, historial y detalle de pedidos.
- Cancelación controlada, reposición de inventario y comprobantes HTML/PDF no fiscales.
- Perfil, direcciones, favoritos, soporte y solicitudes mayoristas.
- Panel administrativo con productos, categorías, contenido, usuarios, pedidos e inventario.
- Estadísticas, nueve series gráficas, reportes y exportaciones CSV/PDF.
- Auditoría de acciones sensibles, borrado lógico y validación segura de imágenes.
- Páginas 403/404, límite de errores, estados de carga y estados vacíos.

## Capturas

Las capturas definitivas están pendientes. Antes de publicarlas se deben revisar y documentar, como mínimo:

- Inicio y tienda en móvil y escritorio.
- Carrito, checkout y comprobante.
- Área privada del cliente.
- Dashboard, inventario y reportes administrativos.

No deben incluir datos personales, tokens, direcciones reales ni credenciales.

## Tecnologías

- Frontend: React 19, Vite, React Router, Chart.js, Lucide React y CSS.
- Backend: Node.js, Express, Prisma, JWT, bcrypt, Multer, PDFKit, Helmet y Express Rate Limit.
- Desarrollo local: SQLite.
- Producción prevista: PostgreSQL.
- Calidad: ESLint, Prettier, Vitest, Node Test Runner y Supertest.

## Arquitectura

```text
Navegador
   │
   ├── Sitio y cuenta del cliente (React)
   └── Panel administrativo (React, carga diferida)
                     │ HTTP/JSON
                     ▼
              API REST (Express)
        validación · autorización · auditoría
                     │
                     ▼
               Prisma ORM
        SQLite local / PostgreSQL futuro
```

Los precios, existencias, descuentos y totales se recalculan en el backend. Las operaciones críticas de pedidos e inventario utilizan transacciones.

## Carpetas

```text
.
├── backend/
│   ├── prisma/          # esquema, migraciones y seed
│   ├── src/             # API, servicios, middlewares y validadores
│   ├── tests/           # pruebas de integración/API
│   └── uploads/         # archivos locales ignorados
├── frontend/
│   ├── public/          # logo, robots y sitemap
│   └── src/             # componentes, páginas, contexto, servicios y estilos
├── docs/                # documentación técnica, guías y borradores legales
├── output/pdf/          # comprobantes demostrativos
└── package.json         # scripts del monorepositorio
```

## Requisitos

- Node.js 20.19 o superior.
- npm 10 o superior.
- Espacio para dependencias y una base SQLite local.
- PostgreSQL y servicios externos solo cuando se prepare producción.

En Windows, si PowerShell bloquea `npm.ps1`, usa `npm.cmd`.

## Instalación

```bash
npm install
```

El alias `npm run install:all` ejecuta el mismo proceso.

## Variables de entorno

Copia los ejemplos sin sobrescribir configuraciones existentes:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

| Variable                  | Uso                                                  |
| ------------------------- | ---------------------------------------------------- |
| `VITE_API_URL`            | URL base de la API consumida por React               |
| `PORT`                    | Puerto del backend                                   |
| `NODE_ENV`                | `development`, `test` o `production`                 |
| `DATABASE_URL`            | Conexión de Prisma                                   |
| `JWT_SECRET`              | Firma de tokens; debe ser largo, aleatorio y privado |
| `JWT_EXPIRES_IN`          | Duración del token de acceso                         |
| `REFRESH_EXPIRES_IN_DAYS` | Vigencia de renovación                               |
| `FRONTEND_URL`            | Origen permitido por CORS                            |
| `EMAIL_MODE`              | `console` durante desarrollo                         |
| `EMAIL_*`                 | Marcadores para el futuro proveedor de correo        |
| `UPLOAD_MAX_SIZE`         | Tamaño máximo de imágenes en bytes                   |

Nunca publiques `.env`. Consulta [DEPLOYMENT.md](./docs/DEPLOYMENT.md) y [SECURITY.md](./docs/SECURITY.md).

## Base de datos, migraciones y seed

La configuración local usa `DATABASE_URL="file:./dev.db"` y crea `backend/prisma/dev.db`.

```bash
npm run prisma:generate
npm run migrate
npm run seed
npm run prisma:validate
npm run db:status
```

- Las migraciones se conservan en `backend/prisma/migrations`.
- La base local está ignorada.
- El seed es idempotente y contiene cuentas y datos ficticios.
- No ejecutes el seed demostrativo en producción sin revisar su contenido.

Consulta [DATABASE.md](./docs/DATABASE.md).

## Ejecución

```bash
npm run dev
```

Por separado:

```bash
npm run dev:frontend
npm run dev:backend
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Salud: `http://localhost:3000/api/health`
- Administración: `http://localhost:5173/admin/login`

## Pruebas y calidad

```bash
npm run check
npm run format
npm audit
```

`npm run check` ejecuta ESLint, comprobación de Prettier, pruebas frontend/backend y build. El estado validado más reciente es 2 pruebas frontend y 39 backend aprobadas. Consulta [QUALITY_REPORT.md](./docs/QUALITY_REPORT.md).

## Credenciales de desarrollo

| Perfil        | Correo                      | Contraseña          |
| ------------- | --------------------------- | ------------------- |
| Administrador | `admin@guadalupana.local`   | `AdminLocal2026!`   |
| Cliente       | `cliente@guadalupana.local` | `ClienteLocal2026!` |
| Editor        | `editor@guadalupana.local`  | `EditorLocal2026!`  |
| Pedidos       | `pedidos@guadalupana.local` | `PedidosLocal2026!` |

Son cuentas ficticias creadas por el seed. Deben eliminarse o cambiarse antes de publicar.

## Estado funcional

### Funcionalidades terminadas

- Autenticación local, sesiones, roles y autorización.
- Cuenta del cliente, catálogo, carrito, pedidos e inventario.
- Solicitudes mayoristas y soporte.
- Administración, estadísticas, reportes, CSV y PDF.
- Calidad básica, páginas de error, SEO inicial y documentación técnica.

### Funcionalidades simuladas

- Correo mediante salida de consola.
- Pago inicialmente pendiente, contra entrega o transferencia manual.
- Datos de empresa, productos, recetas y pedidos de demostración.
- Archivos guardados en disco local.
- Comprobante interno que no es factura electrónica.

### Funcionalidades pendientes

Pago real, correo real, facturación electrónica, almacenamiento externo, dominio, WhatsApp Business, SMS, monitoreo, backups y validación de contenidos legales/nutricionales. Consulta [PENDING_FEATURES.md](./docs/PENDING_FEATURES.md).

## Limitaciones

- SQLite solo se recomienda para desarrollo.
- No existe pasarela ni confirmación automática de pagos.
- No se envía correo real.
- Los archivos no usan almacenamiento externo o CDN.
- No hay facturación electrónica.
- La revisión visual completa, E2E y accesibilidad avanzada continúa pendiente.
- La cobertura, tarifas, horarios y políticas comerciales requieren aprobación.

## Seguridad

El backend utiliza bcrypt, JWT, rotación de sesiones, Helmet, CORS explícito, rate limiting, validación, Prisma, RBAC, auditoría y comprobación de firma binaria para imágenes. Los pedidos propios se filtran por usuario y los totales se calculan en el servidor.

No se deben almacenar ni registrar contraseñas, tokens, números completos de tarjeta o secretos. Revisa [SECURITY.md](./docs/SECURITY.md) antes de desplegar.

## Despliegue, dominio y HTTPS

El proyecto puede desplegarse separando frontend, backend y PostgreSQL. Es posible evaluar planes gratuitos, pero su disponibilidad, precio y límites pueden cambiar y deben verificarse antes de publicar.

- El dominio propio es opcional durante pruebas; un subdominio del proveedor puede ser suficiente.
- Producción debe usar HTTPS.
- `FRONTEND_URL`, `VITE_API_URL`, CORS y enlaces de correo deben usar las URLs definitivas.
- `robots.txt` y `sitemap.xml` contienen `example.com` hasta definir el dominio.

Consulta [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Correo, archivos, pagos y facturación

- **Correo:** `EMAIL_MODE=console` solo imprime enlaces; falta seleccionar e integrar proveedor.
- **Archivos:** se guardan en `backend/uploads`; producción requiere almacenamiento externo y limpieza.
- **Pagos:** no hay pasarela real ni webhooks; no se almacenan datos de tarjeta.
- **Facturación:** los PDF son comprobantes de pedido y no facturas electrónicas.

## Guías

- [Guía de usuario](./docs/USER_GUIDE.md)
- [Guía administrativa](./docs/ADMIN_GUIDE.md)
- [Referencia de API](./docs/API.md)
- [Modelo de datos](./docs/DATABASE.md)
- [Despliegue](./docs/DEPLOYMENT.md)
- [Seguridad](./docs/SECURITY.md)
- [Funciones pendientes](./docs/PENDING_FEATURES.md)
- [Borradores legales](./docs/legal/README.md)

## Solución de problemas

- **Backend sin conexión:** confirma el puerto 3000 y `VITE_API_URL`.
- **CORS:** `FRONTEND_URL` debe coincidir exactamente con el origen del navegador.
- **Prisma no encuentra la base:** revisa `DATABASE_URL`, ejecuta migraciones y genera el cliente.
- **Puerto ocupado:** detén el proceso existente o actualiza todas las URLs relacionadas.
- **PowerShell bloquea npm:** usa `npm.cmd`.
- **Vite/esbuild falla dentro de un sandbox:** ejecuta la validación desde una terminal con acceso normal a la ruta de OneDrive.
- **No llega el correo:** en modo local el enlace aparece en la consola del backend.
- **No hay datos:** ejecuta el seed.

## Licencia

No se ha definido una licencia de distribución. Hasta añadir un archivo `LICENSE`, el código debe tratarse como privado y con todos los derechos reservados. No reutilices el logo o contenido comercial sin autorización.

## Autores o equipo

Marcador editable:

- Responsable del proyecto: `[NOMBRE]`
- Desarrollo: `[NOMBRE O EQUIPO]`
- Contenido y marca: `[NOMBRE]`
- Revisión comercial/legal: `[PENDIENTE]`
