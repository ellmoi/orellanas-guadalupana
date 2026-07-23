# API — Setas La Guadalupana

Referencia del API REST actual. URL local: `http://localhost:3000/api`.

## Convenciones

Las respuestas usan:

```json
{
  "success": true,
  "message": "Descripción",
  "data": {},
  "errors": []
}
```

Las rutas privadas esperan `Authorization: Bearer <accessToken>`. Códigos habituales: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `413`, `422`, `429` y `500`.

## Salud y productos públicos

| Método | Ruta        | Acceso  | Descripción       |
| ------ | ----------- | ------- | ----------------- |
| GET    | `/health`   | Público | Estado del API    |
| GET    | `/products` | Público | Productos activos |

## Autenticación

| Método | Ruta                        | Descripción                     |
| ------ | --------------------------- | ------------------------------- |
| POST   | `/auth/register`            | Crea una cuenta pendiente       |
| POST   | `/auth/login`               | Entrega tokens y usuario        |
| POST   | `/auth/logout`              | Revoca la sesión de renovación  |
| POST   | `/auth/refresh`             | Rota la sesión y renueva tokens |
| GET    | `/auth/me`                  | Usuario autenticado             |
| POST   | `/auth/verify-email`        | Consume token de verificación   |
| POST   | `/auth/resend-verification` | Genera un nuevo enlace          |
| POST   | `/auth/forgot-password`     | Solicita recuperación           |
| POST   | `/auth/reset-password`      | Restablece con token            |
| POST   | `/auth/change-password`     | Cambia contraseña autenticada   |

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"cliente@guadalupana.local","password":"ClienteLocal2026!"}'
```

Los enlaces de correo solo se imprimen en consola mientras `EMAIL_MODE=console`.

## Cuenta del cliente

Prefijo: `/users/me`. Todas requieren autenticación.

| Método     | Ruta                   | Descripción                          |
| ---------- | ---------------------- | ------------------------------------ |
| PATCH      | `/profile`             | Actualiza perfil                     |
| GET/POST   | `/addresses`           | Lista o crea direcciones             |
| PUT/DELETE | `/addresses/:id`       | Actualiza o elimina dirección propia |
| GET        | `/orders`              | Resumen de pedidos del usuario       |
| GET        | `/favorites`           | Lista favoritos                      |
| PUT/DELETE | `/favorites/:type/:id` | Agrega o elimina favorito            |
| GET        | `/dashboard`           | Indicadores del cliente              |
| GET/POST   | `/wholesale-requests`  | Lista o crea solicitud mayorista     |
| POST       | `/support`             | Crea solicitud de soporte            |

`type` admite los tipos implementados por el backend, como `products`.

## Carrito

Prefijo: `/cart`. Requiere autenticación.

| Método | Ruta                | Descripción                      |
| ------ | ------------------- | -------------------------------- |
| GET    | `/`                 | Consulta carrito                 |
| PUT    | `/items`            | Define cantidad de un producto   |
| POST   | `/sync`             | Sincroniza carrito del navegador |
| DELETE | `/items/:productId` | Elimina un producto              |
| DELETE | `/`                 | Vacía el carrito                 |

## Pedidos del cliente

Prefijo: `/orders`. Requiere autenticación y verifica propiedad.

| Método | Ruta               | Descripción                     |
| ------ | ------------------ | ------------------------------- |
| POST   | `/checkout`        | Recalcula y crea pedido         |
| GET    | `/`                | Lista pedidos propios           |
| GET    | `/:id`             | Detalle propio                  |
| POST   | `/:id/cancel`      | Cancela si el estado lo permite |
| POST   | `/:id/repeat`      | Prepara repetición              |
| GET    | `/:id/receipt.pdf` | Descarga comprobante no fiscal  |

## Usuarios administrativos

Prefijo: `/admin/users`. Solo `ADMIN`.

| Método | Ruta              | Descripción             |
| ------ | ----------------- | ----------------------- |
| GET    | `/`               | Lista paginada          |
| GET    | `/:id`            | Detalle                 |
| PATCH  | `/:id/activate`   | Activa                  |
| PATCH  | `/:id/deactivate` | Desactiva               |
| PATCH  | `/:id/verify`     | Marca correo verificado |
| PATCH  | `/:id/role`       | Reemplaza rol           |
| GET    | `/:id/history`    | Historial auditado      |

## Administración

Prefijo: `/admin`. Requiere rol administrativo y permisos por módulo.

| Método     | Ruta                            | Descripción                    |
| ---------- | ------------------------------- | ------------------------------ |
| GET        | `/dashboard`                    | Indicadores y gráficos         |
| GET        | `/analytics/charts`             | Series analíticas              |
| GET        | `/inventory`                    | Inventario y movimientos       |
| POST       | `/inventory/movements`          | Movimiento transaccional       |
| GET        | `/reports/options`              | Opciones de filtros            |
| GET        | `/reports/:type`                | Vista de reporte               |
| GET        | `/reports/:type/export/:format` | Exporta CSV/PDF                |
| GET/POST   | `/products`                     | Lista o crea productos         |
| PUT/DELETE | `/products/:id`                 | Actualiza o archiva producto   |
| POST       | `/products/:id/images`          | Carga imagen validada          |
| GET/POST   | `/recipes`                      | Lista o crea recetas           |
| PUT/DELETE | `/recipes/:id`                  | Actualiza o archiva receta     |
| GET        | `/files/:name`                  | Archivo protegido              |
| GET/POST   | `/:resource`                    | Lista o crea recurso permitido |
| PUT/DELETE | `/:resource/:id`                | Actualiza o archiva recurso    |

Formatos de reporte: `csv` y `pdf`. Tipos disponibles incluyen pedidos, ventas, productos, inventario, usuarios y segmentos definidos en el servicio de analítica.

## Pedidos administrativos

Prefijo: `/admin/orders`. Roles `ADMIN` y `ORDER_MANAGER`.

| Método | Ruta               | Descripción             |
| ------ | ------------------ | ----------------------- |
| GET    | `/`                | Lista pedidos           |
| PATCH  | `/:id/status`      | Cambia estado permitido |
| GET    | `/:id/receipt.pdf` | Genera comprobante      |
| POST   | `/:id/payment`     | Registra pago manual    |
| PATCH  | `/:id/note`        | Actualiza nota interna  |

## Seguridad del API

- Rate limiting general y límites más estrictos en autenticación.
- Validación con `express-validator`.
- Prisma evita concatenar SQL manual.
- Respuestas administrativas dependen de roles y permisos.
- La carga de imágenes valida tamaño, extensión, MIME y firma binaria.
- Los errores internos no se exponen al cliente.

Consulta [SECURITY.md](./SECURITY.md) y las pruebas en `backend/tests`.
