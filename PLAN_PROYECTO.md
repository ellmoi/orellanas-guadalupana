# Plan de proyecto — Setas La Guadalupana

> Documento de arquitectura y alcance inicial. No representa funcionalidades ya implementadas.

## 1. Resumen

Setas La Guadalupana será una plataforma web responsive para presentar la empresa familiar, educar sobre las orellanas y vender productos tanto a consumidores finales como a restaurantes, negocios gastronómicos, mayoristas y distribuidores. Tendrá dos experiencias claramente separadas: el sitio y área privada del cliente, y un panel administrativo protegido.

La primera versión debe poder ejecutarse sin servicios de pago en un equipo local. La arquitectura se preparará para sustituir simulaciones y adaptadores locales por correo, pagos, almacenamiento y otros proveedores reales cuando se despliegue. Toda función simulada deberá estar identificada de forma visible y nunca se presentará un comprobante interno como factura electrónica.

### Estado inicial examinado

- El repositorio solo contiene `logo-setas-la-guadalupana.png`; todavía no hay código, configuración, base de datos ni documentación.
- El logo fuente es PNG, mide 637 × 632 px y utiliza canal alfa. Presenta tres orellanas ilustradas en crema sobre verde bosque, composición circular y tipografía con carácter artesanal.
- Se conservará el archivo original sin alterarlo. En una etapa posterior se generarán copias optimizadas para web y un favicon legible, manteniendo forma, colores y reconocimiento de marca.

### Principios de producto

- Experiencia cálida, accesible, confiable y fácil de usar desde móvil.
- Información verificable: no inventar propiedades nutricionales, certificaciones, disponibilidad ni tiempos de entrega.
- Separación entre interfaz, API, persistencia e integraciones externas.
- Código y documentación claros; comentarios educativos en español solo donde aporten contexto.
- Herramientas gratuitas y de código abierto, con dependencias mantenidas y el mínimo acoplamiento a proveedores.

## 2. Usuarios

| Tipo                  | Necesidad principal                                                   | Acceso previsto                           |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------- |
| Visitante             | Conocer la marca, productos, recetas y formas de contacto             | Público                                   |
| Cliente minorista     | Comprar para el hogar, guardar favoritos y consultar pedidos          | Público + cuenta opcional/privada         |
| Comprador empresarial | Solicitar condiciones por volumen y administrar pedidos empresariales | Cuenta verificada                         |
| Distribuidor          | Consultar disponibilidad y gestionar solicitudes comerciales          | Cuenta verificada y condiciones asignadas |
| Operador              | Preparar pedidos, actualizar estados e inventario                     | Panel administrativo limitado             |
| Editor de contenido   | Gestionar recetas, páginas y contenidos                               | Panel administrativo limitado             |
| Administrador         | Gestionar catálogo, usuarios, pedidos, configuración y reportes       | Panel administrativo completo             |
| Superadministrador    | Administrar permisos y ajustes críticos                               | Acceso excepcional y auditado             |

Los permisos se aplicarán en el backend mediante RBAC (roles y permisos), no solo ocultando elementos en la interfaz. Un cliente empresarial no obtiene precios o condiciones especiales hasta que un administrador apruebe su solicitud.

## 3. Arquitectura

Se propone un monorepositorio JavaScript con frontend React y API REST Express:

```text
Navegador
   ├── Sitio/área cliente (React + Vite)
   └── Panel administrativo (rutas y layout independientes)
                         │ HTTPS / JSON
                         ▼
API REST (Express)
   ├── controladores y validación
   ├── servicios de negocio
   ├── autorización y auditoría
   └── adaptadores de integraciones
                         │
                         ▼
Prisma ORM ── PostgreSQL
             (SQLite solo como alternativa local acotada)
```

### Decisiones principales

- **Frontend:** React, Vite, React Router, Context API para estado global acotado, Fetch API, CSS modular o por capas, Lucide React y Chart.js solo en estadísticas.
- **Backend:** Node.js, Express, Prisma, JWT, bcrypt, Express Validator, Helmet, CORS con lista permitida, Morgan y limitación de solicitudes.
- **Persistencia:** PostgreSQL como base canónica. Para desarrollo, PostgreSQL puede ejecutarse gratuitamente con Docker. SQLite podrá usarse en pruebas o demostraciones simples, pero requiere un esquema Prisma específico y validaciones porque no replica completamente PostgreSQL.
- **API:** versionada bajo `/api/v1`, respuestas consistentes, paginación, filtros, códigos HTTP correctos y un manejador central de errores.
- **Autenticación:** token de acceso de vida corta y renovación segura. Preferencia por cookies `HttpOnly`, `Secure` en producción y `SameSite`, evitando guardar tokens sensibles en `localStorage`.
- **Archivos:** adaptador `StorageProvider`; almacenamiento local en desarrollo y proveedor externo en producción.
- **Correo y pagos:** interfaces por proveedor para activar simuladores locales o integraciones reales sin reescribir la lógica de pedidos.
- **Despliegue:** frontend estático, API Node y PostgreSQL administrado o autohospedado. Contenedores serán opcionales para desarrollo y recomendados para reproducibilidad.

## 4. Carpetas

Estructura objetivo; se creará progresivamente, no en esta etapa:

```text
orellanas-guadalupana/
├── frontend/
│   ├── public/
│   │   └── assets/brand/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   │   ├── customer/
│   │   │   └── admin/
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── account/
│   │   │   └── admin/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── tests/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── providers/
│   │   │   ├── email/
│   │   │   ├── payment/
│   │   │   └── storage/
│   │   ├── jobs/
│   │   ├── utils/
│   │   └── app.js
│   ├── storage/              # ignorado por Git; solo desarrollo
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── api/
│   ├── arquitectura/
│   ├── decisiones/
│   └── manuales/
├── logo-setas-la-guadalupana.png
├── PLAN_PROYECTO.md
├── README.md
├── .gitignore
└── package.json              # scripts del monorepositorio
```

Los artefactos generados, secretos, cargas, bases locales y dependencias (`.env`, `storage/`, `*.db`, `node_modules/`, cobertura y compilados) deben quedar en `.gitignore`. Los `.env.example` contendrán únicamente nombres y valores de ejemplo no secretos.

## 5. Módulos

### Sitio público

- Inicio con propuesta de valor, productos destacados, historia familiar y llamadas a la acción.
- Tienda, filtros básicos, ficha de producto, disponibilidad y presentación/peso.
- Recetas con buscador, categorías e instrucciones administrables.
- Información sobre la orellana con contenidos respaldados por fuentes revisables.
- Restaurantes y mayoristas con beneficios, requisitos y formulario de solicitud.
- Nosotros, contacto, preguntas frecuentes y políticas.

### Cuenta del cliente

- Registro, verificación de correo, inicio/cierre de sesión y recuperación de contraseña.
- Perfil, direcciones, preferencias y gestión de consentimiento.
- Favoritos, carrito persistente, checkout, historial y detalle de pedidos.
- Descarga de comprobante comercial claramente rotulado como **no equivalente a factura electrónica** cuando corresponda.

### Comercio

- Catálogo, variantes/presentaciones, precios vigentes e inventario.
- Carrito, cupones futuros, cálculo de totales y reglas de entrega.
- Pedidos, historial de estados, pagos simulados/reales y comprobantes.
- Segmentación minorista/empresarial y listas de precios autorizadas.

### Panel administrativo

- Tablero de indicadores.
- Productos, categorías, presentaciones, imágenes y precios.
- Recetas, páginas y contenido del sitio.
- Usuarios, roles, permisos y solicitudes empresariales.
- Pedidos, pagos, entregas, cancelaciones y notas internas.
- Inventario, movimientos, alertas y ajustes con trazabilidad.
- Estadísticas y reportes exportables.
- Configuración del sitio e integraciones.
- Registro de auditoría consultable y no editable desde operaciones normales.

## 6. Modelos de datos

Todos los modelos usarán identificadores no predecibles (UUID/CUID), fechas de creación/actualización y borrado lógico cuando preservar historial sea necesario. Los importes se almacenarán como enteros en centavos de COP, nunca como punto flotante.

### Identidad y acceso

- **User:** correo normalizado único, hash de contraseña, nombre, teléfono opcional, estado, correo verificado, último acceso.
- **Role, Permission, UserRole, RolePermission:** autorización granular.
- **EmailVerificationToken:** hash del token, expiración y fecha de uso.
- **PasswordResetToken:** hash del token, expiración y fecha de uso.
- **RefreshSession:** hash de renovación, dispositivo/IP resumidos, expiración y revocación.
- **Address:** propietario, destinatario, teléfono, dirección, municipio/departamento, indicaciones y predeterminada.
- **ConsentRecord:** política, versión, aceptación/revocación, fecha y evidencia mínima.

### Clientes empresariales

- **BusinessProfile:** usuario/empresa, razón o nombre comercial, identificación tributaria opcional, contacto, tipo de negocio, ciudad, volumen estimado, estado de aprobación.
- **WholesaleApplication:** datos enviados, estado, responsable, observaciones internas y fechas de revisión.
- **PriceList, PriceListItem, BusinessPriceAssignment:** vigencia y precios negociados por variante, sin modificar el precio público.

### Catálogo y contenido

- **Category:** nombre, slug, descripción, orden y estado.
- **Product:** nombre, slug, descripción, conservación, estado y categoría.
- **ProductVariant:** presentación, unidad, cantidad, SKU único, precio base, estado y control de inventario.
- **ProductImage:** producto, ubicación, texto alternativo, orden y portada.
- **Favorite:** usuario y producto, con unicidad compuesta.
- **Recipe, RecipeIngredient, RecipeStep, RecipeCategory:** contenido, portada, dificultad/tiempo opcionales y publicación.
- **ContentPage:** clave, título, slug, contenido, versión, autor y publicación.
- **SiteSetting:** clave permitida, valor no secreto y tipo; nunca credenciales.

### Carrito, pedidos y pagos

- **Cart, CartItem:** propietario o sesión invitada, variante, cantidad y fecha de expiración.
- **Order:** número legible único, cliente, canal, estado, moneda, subtotal, descuentos, entrega, total, dirección congelada y datos de contacto congelados.
- **OrderItem:** nombre/SKU/presentación/precio congelados para conservar la historia aunque cambie el catálogo.
- **OrderStatusHistory:** estado anterior/nuevo, actor, comentario y fecha.
- **Payment:** pedido, proveedor, referencia externa, estado, importe, método y fechas. No almacenar datos completos de tarjeta.
- **PaymentEvent:** identificador externo único, tipo y resultado de procesamiento para webhooks idempotentes.
- **Delivery:** modalidad, zona, costo, estado, ventana y referencia de transporte opcional.
- **Receipt:** consecutivo, pedido, archivo, fecha y tipo documental explícito.

### Inventario, operación y control

- **InventoryMovement:** variante, tipo (entrada, reserva, liberación, salida, ajuste), cantidad, referencia, actor y fecha.
- **InventoryBalance:** existencia y reserva por variante; se actualiza mediante transacción.
- **ContactMessage:** remitente, canal, contenido, consentimiento y estado.
- **Notification:** usuario, tipo, canal, estado y referencia.
- **AuditLog:** actor, acción, entidad, identificador, cambios sanitizados, fecha e IP resumida.

### Reglas críticas

- El total de una orden se recalcula en el servidor usando precios vigentes/autorizados; nunca se confía en el total del navegador.
- Crear pedido, reservar inventario y registrar movimientos debe ejecutarse en una transacción.
- La confirmación de pago real depende de una respuesta firmada o consulta al proveedor, no del retorno del navegador.
- La información histórica del pedido se conserva mediante instantáneas de producto, precio y dirección.
- Los estados se cambiarán mediante transiciones permitidas, evitando saltos arbitrarios.

## 7. Flujo de registro

1. El visitante elige cuenta personal o solicitud empresarial.
2. Completa datos mínimos, contraseña y aceptación versionada de políticas.
3. El frontend valida usabilidad; el backend vuelve a validar, normaliza el correo y limita intentos.
4. El backend genera el usuario pendiente, cifra la contraseña con bcrypt y crea un token de verificación aleatorio almacenado como hash.
5. En local, el enlace se muestra solo mediante un buzón de desarrollo o registro seguro marcado como simulación. En producción se envía por proveedor de correo.
6. Al abrir el enlace, el servidor valida hash, uso y expiración; luego marca el correo como verificado.
7. El usuario inicia sesión y recibe una sesión segura. Los tokens de renovación se rotan y pueden revocarse.
8. La recuperación usa mensajes neutros para no revelar si una cuenta existe, tokens de un solo uso y revocación de sesiones tras el cambio.
9. Si es empresarial, completa su perfil y queda en revisión; el alta no concede automáticamente condiciones mayoristas.

## 8. Flujo de compra

1. El cliente explora productos y selecciona una presentación disponible.
2. Agrega unidades al carrito; el servidor valida producto, cantidad y límites. El carrito puede existir como invitado y fusionarse al iniciar sesión.
3. En checkout, identifica comprador, dirección/modalidad de entrega y método de pago.
4. El backend recalcula precios, disponibilidad, descuentos y entrega; muestra un resumen final antes de confirmar.
5. Al confirmar, una transacción crea la orden en estado pendiente y reserva inventario durante un tiempo definido.
6. En modo local, el pago se simula con estados de prueba claramente rotulados. En producción, el cliente continúa con la pasarela y el backend espera confirmación verificable.
7. Pago aprobado: la orden pasa a confirmada, se registra historial y se notifica. Pago fallido/expirado: se libera la reserva.
8. Operación prepara, despacha o deja listo el pedido según modalidad, registrando cada transición.
9. El cliente consulta el estado y descarga un comprobante. El documento no se denomina factura electrónica salvo integración legal certificada.
10. Cancelaciones y devoluciones se regirán por políticas aprobadas y permisos; toda restitución de inventario deja movimiento.

## 9. Flujo mayorista

1. El interesado consulta la sección para restaurantes/distribuidores y completa una solicitud.
2. El sistema registra tipo de negocio, ubicación, contacto y volumen estimado; no solicita documentos innecesarios en la primera toma de contacto.
3. Un administrador revisa, solicita información adicional fuera del flujo automático si hace falta, y aprueba o rechaza con trazabilidad.
4. Al aprobar, vincula un perfil empresarial, condiciones y lista de precios con vigencia.
5. El comprador autenticado ve presentaciones, cantidades mínimas y precios asignados; los demás usuarios no acceden a ellos.
6. Envía una solicitud de cotización o un pedido, según la configuración comercial. Los precios y condiciones se congelan al confirmar.
7. El administrador valida disponibilidad, fecha de entrega y forma de pago. Para grandes volúmenes puede convertir una cotización aceptada en pedido.
8. Preparación, entrega, comprobante y seguimiento usan el flujo de estados con auditoría.

La primera versión debería priorizar **solicitud y aprobación manual** sobre reglas comerciales complejas, pues es más segura para una operación familiar y permite aprender de los pedidos reales.

## 10. Flujo administrativo

1. El personal entra por `/admin/login`; el servidor verifica credenciales, estado y permiso. Se recomienda MFA para administradores al desplegar.
2. El tablero muestra solo datos autorizados: pedidos pendientes, alertas de inventario y métricas agregadas.
3. Cada módulo aplica permisos específicos para ver, crear, editar, publicar, cancelar, exportar o configurar.
4. Los cambios críticos (roles, precios, inventario, estados, pagos y configuración) generan auditoría.
5. Un operador confirma/prepara/despacha pedidos únicamente mediante transiciones válidas.
6. Los ajustes de inventario exigen motivo y actor; no se edita directamente el saldo.
7. El editor prepara contenido en borrador y lo publica sin acceder a usuarios o pagos.
8. Los reportes filtran por rango y estado; las exportaciones evitan datos personales innecesarios.
9. La configuración separa datos públicos de secretos. Las credenciales se gestionan en variables de entorno, nunca en la interfaz o base de datos sin un sistema seguro dedicado.
10. Cierre de sesión, revocación y expiración reducen sesiones administrativas abandonadas.

## 11. Seguridad

- Hash de contraseñas con bcrypt y costo configurable; política de longitud y bloqueo/retardo progresivo ante abuso.
- Validación y normalización del lado servidor; límites de tamaño, tipos MIME permitidos y nombres aleatorios para archivos.
- Helmet, CORS por orígenes explícitos, rate limiting por ruta sensible y registro sin contraseñas, tokens ni datos financieros.
- Cookies seguras y protección CSRF si se autentica mediante cookies; prevención XSS evitando HTML no confiable o sanitizándolo.
- Consultas mediante Prisma y autorización por recurso para prevenir acceso horizontal a pedidos, direcciones y perfiles.
- Tokens aleatorios de un solo uso guardados como hash, expirables y revocables.
- Webhooks con firma, idempotencia y protección contra repetición cuando exista pasarela.
- Secretos exclusivamente en variables de entorno/plataforma; `.env` ignorado y rotación documentada.
- Copias de seguridad cifradas, restauración probada y retención definida al desplegar.
- Auditoría sanitizada para acciones sensibles; no guardar más datos personales de los necesarios.
- Dependencias revisadas y actualizadas, análisis automático y pruebas de permisos.
- Cumplimiento de protección de datos aplicable en Colombia: aviso de privacidad, finalidad, consentimiento cuando corresponda y proceso para consultas, corrección o eliminación sujeto a obligaciones de conservación. Validar textos con asesoría legal.
- Facturación electrónica, términos de venta, retracto, tratamiento tributario y políticas de entrega requieren validación profesional antes de producción.

## 12. Funciones locales

Pueden funcionar completamente sin pagar servicios:

- Sitio público, navegación, diseño responsive y contenidos de demostración.
- Registro, login, roles y permisos en entorno local.
- Catálogo, variantes, recetas, favoritos, carrito, pedidos e inventario.
- Panel administrativo, auditoría, estadísticas y reportes basados en datos locales.
- PostgreSQL local con Docker o instalación local; SQLite para pruebas acotadas.
- Carga de imágenes al disco local y generación de comprobantes PDF de prueba.
- Correo capturado por un buzón SMTP de desarrollo como Mailpit, sin entrega real.
- Pago simulado con escenarios aprobado/rechazado/pendiente, rotulado como simulación.
- Pruebas unitarias, de integración y componentes.

Las semillas usarán datos ficticios claramente identificados. Ninguna simulación será anunciada como servicio real.

## 13. Servicios externos

| Capacidad               | Necesidad para producción                                  | Preparación técnica                                |
| ----------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Correo real             | Proveedor SMTP/transaccional y dominio validado            | `EmailProvider`; TODO seleccionar proveedor        |
| Pago                    | Pasarela habilitada para Colombia, credenciales y webhooks | `PaymentProvider`; TODO evaluación legal/comercial |
| Imágenes                | Almacenamiento de objetos/CDN                              | `StorageProvider`; TODO seleccionar proveedor      |
| Dominio y DNS           | Registro y configuración pública                           | Variables de URL; TODO adquirir/configurar         |
| HTTPS                   | Certificado TLS, normalmente incluido por hosting/proxy    | Redirección y cookies seguras; TODO despliegue     |
| Facturación electrónica | Proveedor tecnológico autorizado y requisitos fiscales     | Módulo separado; TODO asesoría contable/legal      |
| WhatsApp Business       | Meta/proveedor, plantillas y consentimiento                | Adaptador de mensajería; TODO alta y aprobación    |
| SMS                     | Proveedor y presupuesto por mensaje                        | Adaptador opcional; TODO seleccionar proveedor     |
| Backups externos        | Almacenamiento independiente y automatización              | Jobs y guía de restauración; TODO infraestructura  |
| Monitoreo               | Errores, disponibilidad, métricas y alertas                | Logs estructurados/health check; TODO proveedor    |
| Mapas/direcciones       | Solo si se requiere geocodificación o tarifas por zona     | Interfaz opcional; TODO definir reglas de entrega  |

Antes de elegir proveedores se compararán costos reales, soporte en Colombia, manejo de datos, facilidad de salida y ambientes de prueba. Los niveles gratuitos no deben asumirse permanentes.

## 14. Etapas de desarrollo

1. **Descubrimiento y decisiones:** aprobar alcance MVP, políticas comerciales, modalidades de entrega, contenidos, roles y criterios de éxito.
2. **Fundación técnica:** monorepositorio, configuración, estilos base, esquema Prisma, migraciones, datos semilla, validaciones y CI local.
3. **Identidad y sitio público:** sistema visual, assets optimizados, accesibilidad, inicio, nosotros, información, contacto y recetas.
4. **Autenticación y cuentas:** registro, verificación local, sesiones, recuperación, perfil, direcciones y permisos.
5. **Catálogo y carrito:** productos, presentaciones, inventario visible, favoritos y carrito persistente.
6. **Checkout y pedidos locales:** cálculo del servidor, reservas, pago simulado, estados y comprobante no fiscal.
7. **Mayoristas:** solicitud, revisión, perfil empresarial, listas de precios y cotización/pedido.
8. **Administración:** catálogo, contenido, usuarios, pedidos, inventario, configuración y auditoría.
9. **Calidad:** pruebas unitarias/integración/E2E críticas, accesibilidad, seguridad, rendimiento, respaldos y documentación.
10. **Integraciones y despliegue:** elegir proveedores, activar correo/pagos/storage, configurar dominio/HTTPS/monitoreo y ejecutar pruebas en sandbox.
11. **Salida controlada:** carga de contenido real, capacitación, prueba piloto, revisión legal/contable y puesta en producción.

Cada etapa debe cerrar con lint, pruebas pertinentes, compilación, revisión responsive y corrección de errores antes de avanzar.

## 15. Riesgos y recomendaciones

| Riesgo                                             | Impacto                              | Recomendación                                                                        |
| -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| Alcance demasiado amplio                           | Retraso y producto difícil de operar | Definir MVP: catálogo, carrito, pedido local, contenido y administración esencial    |
| Producto perecedero                                | Venta sin disponibilidad o pérdidas  | Reservas temporales, movimientos auditados, límites y confirmación operativa         |
| Entrega variable por zona                          | Totales o promesas incorrectas       | Empezar con zonas y tarifas administrables; confirmar cobertura antes del pago       |
| Precio mayorista complejo                          | Errores comerciales                  | Aprobación manual y listas con vigencia; evitar motor avanzado inicialmente          |
| Confundir simulación con servicio real             | Pérdida de confianza y riesgo legal  | Etiquetas visibles, ambientes separados y pruebas de configuración de producción     |
| Comprobante confundido con factura                 | Riesgo tributario                    | Texto explícito y módulo fiscal separado hasta integrar proveedor autorizado         |
| Datos nutricionales/certificaciones no verificados | Riesgo reputacional o regulatorio    | Publicar solo contenido con fuente y aprobación; registrar fuente/fecha internamente |
| Seguridad de cuentas y panel                       | Fraude o fuga de datos               | MFA administrativo, mínimo privilegio, sesiones cortas, rate limits y auditoría      |
| Datos personales excesivos                         | Mayor exposición y obligaciones      | Minimización, retención definida, acceso restringido y política revisada             |
| Diferencias SQLite/PostgreSQL                      | Fallos al desplegar                  | Usar PostgreSQL local como ruta principal y SQLite solo para pruebas simples         |
| Dependencia de un proveedor                        | Costos o migración difícil           | Adaptadores, referencias externas genéricas y exportación de datos                   |
| Logo pesado o poco legible en tamaños pequeños     | Rendimiento y reconocimiento         | Conservar original; crear WebP/PNG responsivos y favicon simplificado aprobado       |

### Recomendación de MVP

La primera entrega operativa debería incluir sitio público, catálogo, carrito, checkout con pago simulado, pedidos, inventario básico, autenticación y administración esencial. Favoritos, recuperación de cuenta y solicitud mayorista pueden incorporarse a continuación. Pasarela real, factura electrónica, WhatsApp/SMS y automatizaciones avanzadas deben esperar hasta validar operación, requisitos legales y proveedores.

### Decisiones pendientes antes de implementar

- Cobertura geográfica, recogida/entrega, tarifas, horarios y pedido mínimo.
- Presentaciones, precios, capacidad diaria, política de reservas y agotados.
- Compra como invitado y requisitos exactos de cuenta.
- Proceso empresarial: cotización, pedido directo, crédito y aprobación.
- Roles reales del equipo y quién autoriza precios, ajustes y cancelaciones.
- Políticas de privacidad, venta, cambios, devoluciones y conservación de datos.
- Contenidos verificables, fotografías adicionales y autorización final de derivados del logo.
