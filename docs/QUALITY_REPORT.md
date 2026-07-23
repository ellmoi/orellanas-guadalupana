# Informe de calidad técnica y visual

Fecha: 23 de julio de 2026

## Resultado

La revisión técnica quedó aprobada por lint, formato, pruebas automatizadas, auditoría de dependencias y compilación. La revisión visual automatizada completa quedó pendiente porque no había un navegador conectado en la sesión. El PDF se validó por API y firma de archivo, pero no pudo renderizarse porque Poppler no está instalado.

## Errores encontrados y corregidos

- Las rutas desconocidas redirigían al inicio. Ahora muestran una página 404 comprensible.
- Un usuario autenticado sin un rol administrativo permitido era redirigido. Ahora recibe una página 403 explícita.
- React no tenía un límite de errores. Se añadió un `ErrorBoundary` con recuperación y mensaje comprensible.
- Solo existía un título y una descripción global. Se añadieron títulos y metadescripciones por ruta, etiquetas Open Graph y directivas para robots.
- Faltaban `robots.txt` y `sitemap.xml`. Se añadieron con un dominio de ejemplo que debe reemplazarse al definir el dominio público.
- No existía un enlace para saltar al contenido ni un estilo global de foco visible. Ambos fueron incorporados.
- La carga de imágenes confiaba en la extensión y el MIME declarado. Ahora valida también la firma binaria de PNG, JPEG y WebP, elimina archivos rechazados y responde de forma controlada ante errores de Multer.
- Se añadió una prueba que intenta cargar texto fingiendo ser PNG.
- Faltaba Prettier. Se añadieron configuración, exclusiones y scripts `format` y `check:format`; la comprobación forma parte de `npm run check`.
- ESLint detectó una dependencia incompleta en un efecto del panel de cliente. Se corrigió con `useCallback`.
- `nodemailer` estaba instalado pero no se usaba y tenía una vulnerabilidad conocida de severidad alta. Se eliminó; `npm audit` informa cero vulnerabilidades.
- El paquete inicial superaba 500 kB. El panel administrativo y Chart.js ahora se cargan de forma diferida; el sitio público quedó en aproximadamente 272 kB y el módulo administrativo en 229 kB antes de gzip.

## Controles comprobados

- Helmet habilitado y cabecera `x-powered-by` desactivada.
- CORS restringido al origen configurado.
- Rate limiting general y un límite más estricto en autenticación.
- Contraseñas con bcrypt, JWT, rotación/revocación y serialización sin hashes.
- Autorización por rol para usuarios, administración, pedidos, inventario y reportes.
- Pedidos propios filtrados por `userId`.
- Cambio de roles limitado a administrador y protegido contra retirar el propio rol administrativo.
- Validación de solicitudes con `express-validator`.
- Cálculo de precios, existencias y totales dentro del backend y con transacciones Prisma.
- Errores internos ocultos al cliente.
- Nombres aleatorios, límite de tamaño, extensión, MIME y firma binaria para imágenes.
- CSS responsive existente para móvil, tableta y escritorio.
- Estados de carga y estados vacíos en paneles y flujos principales.
- CSS de impresión para el comprobante.

## Pruebas

Resultado de `npm run check`:

- ESLint frontend: aprobado sin advertencias.
- ESLint backend: aprobado sin advertencias.
- Prettier: todos los archivos incluidos cumplen el formato.
- Frontend: 2 pruebas aprobadas.
- Backend: 39 pruebas aprobadas.
- Total: 41 pruebas aprobadas.
- Build Vite: aprobado.
- `npm audit`: 0 vulnerabilidades conocidas.

Las pruebas backend cubren salud, autenticación, autorización, administración, productos, carga de archivos, pedidos, inventario, estadísticas, reportes y generación de PDF.

## Archivos locales y secretos

`.gitignore` excluye `.env`, bases SQLite, `node_modules`, compilados, logs, archivos temporales y cargas locales. En el espacio de trabajo existen un `.env`, una base local, dependencias y logs necesarios para desarrollo; no deben publicarse. No fue posible confirmar su estado en Git porque `.git` aparece como un punto de reanálisis de OneDrive y Git no lo reconoce como repositorio.

Los enlaces de verificación impresos por `EMAIL_MODE=console` pueden aparecer en logs locales. La carpeta `logs/` está ignorada y debe excluirse de cualquier despliegue o archivo compartido.

## Pendientes antes de producción

- Sustituir `example.com` en `robots.txt` y `sitemap.xml` por el dominio definitivo.
- Ejecutar una revisión manual o automatizada con navegador en 320, 768, 1024 y 1440 px.
- Probar navegación completa por teclado, lector de pantalla y contraste con herramientas especializadas.
- Instalar Poppler y renderizar el comprobante PDF para revisar visualmente márgenes, saltos y textos largos.
- Ampliar las pruebas de componentes frontend y añadir E2E para registro, compra y administración.
- Configurar correo real sin registrar tokens y conservar los TODO de pagos, almacenamiento y facturación.
