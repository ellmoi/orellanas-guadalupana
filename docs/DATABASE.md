# Base de datos

## Entornos

- Desarrollo y pruebas locales: SQLite mediante `file:./dev.db`.
- Producción prevista: PostgreSQL después de adaptar, migrar y probar el esquema.

El esquema principal está en `backend/prisma/schema.prisma`.

## Áreas del modelo

- Identidad: `User`, `Role`, `UserRole`, sesiones y tokens.
- Cliente: direcciones, favoritos y solicitudes.
- Catálogo: productos, imágenes, videos y categorías.
- Contenido: recetas, publicaciones, testimonios y preguntas frecuentes.
- Comercio: carrito, pedidos, líneas, pagos e historial de estados.
- Operación: movimientos de inventario, contactos y auditoría.
- Comercial: descuentos, cupones, reseñas y solicitudes mayoristas.
- Configuración: `SiteSetting`.

Los precios y totales se almacenan como enteros en centavos de COP para evitar errores de coma flotante.

## Comandos

```bash
npm run prisma:generate
npm run prisma:validate
npm run migrate
npm run db:status
npm run seed
```

## Migraciones

Las migraciones versionables están en `backend/prisma/migrations`. En desarrollo, `npm run migrate` ejecuta `prisma migrate dev`.

Para producción se debe usar el flujo no interactivo correspondiente a Prisma, después de:

1. Crear una copia de seguridad.
2. Verificar `DATABASE_URL`.
3. Probar la migración en un ambiente previo.
4. Ejecutar la migración antes de iniciar la nueva versión.
5. Comprobar `/api/health` y operaciones críticas.

No edites una migración ya aplicada en producción.

## Seed

`npm run seed` crea datos ficticios idempotentes:

- Roles y cuentas de desarrollo.
- Categorías y productos demostrativos.
- Recetas y configuración con marcadores.
- Pedidos, movimientos y visitas para gráficos.

No ejecutes el seed demostrativo en producción sin retirar credenciales, datos ficticios y marcadores `TODO`.

## Integridad

- SKU, slugs y otras claves usan restricciones únicas.
- Pedidos conservan instantáneas de nombre, presentación, precio y dirección.
- Creación/cancelación de pedidos e inventario usan transacciones.
- El borrado lógico conserva historia en entidades seleccionadas.
- Los movimientos de inventario registran actor, motivo y referencia.

## Copias de seguridad

SQLite: detén escrituras y copia el archivo de base a una ubicación protegida. PostgreSQL: usa las herramientas y políticas del proveedor. En producción se necesitan backups automáticos, cifrados, con retención definida y restauraciones probadas.

Nunca publiques `backend/prisma/dev.db`.
