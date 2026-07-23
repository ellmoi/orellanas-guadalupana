# Guía administrativa

## Acceso

Abre `/admin/login`. Solo pueden entrar `ADMIN`, `CONTENT_EDITOR` y `ORDER_MANAGER`; cada rol ve y ejecuta únicamente acciones autorizadas.

| Rol              | Alcance principal                                                 |
| ---------------- | ----------------------------------------------------------------- |
| `ADMIN`          | Usuarios, contenido, pedidos, configuración, auditoría y reportes |
| `CONTENT_EDITOR` | Productos, categorías y contenido                                 |
| `ORDER_MANAGER`  | Pedidos, inventario, solicitudes y reportes operativos            |

## Dashboard

Muestra indicadores, rankings y gráficos de ventas, pedidos, clientes, ciudades, categorías, productos e inventario. Los datos del seed son demostrativos.

## Catálogo y contenido

- Crea primero borradores.
- Usa slugs legibles y SKU únicos.
- No publiques afirmaciones nutricionales o certificaciones sin verificar.
- Las eliminaciones configuradas son lógicas y conservan historia.
- Las imágenes deben ser JPG, PNG o WebP válidas.

## Pedidos

- Revisa contacto, entrega, estado y notas.
- Usa solo transiciones permitidas.
- Registra pagos manuales únicamente después de verificarlos.
- No marques como pagado basándote en una captura sin procedimiento interno.
- El PDF es un comprobante, no factura electrónica.

## Inventario

No edites saldos directamente. Registra un movimiento con:

- Producto.
- Tipo.
- Cantidad.
- Motivo.
- Referencia cuando exista.

El sistema registra actor y evita existencias negativas.

## Usuarios y roles

Solo `ADMIN` puede activar, desactivar, verificar o cambiar roles. Aplica mínimo privilegio y revisa el historial. El sistema impide que un administrador se retire a sí mismo el rol administrativo mediante esa operación.

## Reportes

Configura filtros y revisa la vista previa antes de exportar. CSV y PDF omiten hashes, tokens y secretos. Evita descargar datos personales innecesarios y protege los archivos exportados.

## Operación segura

- Usa una cuenta individual.
- Cierra sesión.
- No compartas credenciales.
- No publiques logs o bases locales.
- Reporta errores sin incluir tokens.
- Revisa alertas de inventario y auditoría.

## Antes de producción

Retira credenciales demostrativas, configura datos de empresa, valida textos, dominio, HTTPS, backups, monitoreo, correo, almacenamiento y procedimientos comerciales.
