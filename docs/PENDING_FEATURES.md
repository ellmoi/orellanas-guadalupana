# Funcionalidades pendientes

Los estados describen el proyecto actual y no constituyen promesas comerciales.

| Funcionalidad                      | Estado                    | Qué falta                                                                     | Servicio requerido                        | Prioridad |
| ---------------------------------- | ------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- | --------- |
| Pago real                          | Simulado                  | Seleccionar pasarela, sandbox, webhooks firmados, idempotencia y conciliación | Pasarela habilitada para Colombia         | Alta      |
| Correo real                        | Simulado en consola       | Proveedor, dominio verificado, plantillas, rebotes y protección de tokens     | SMTP o correo transaccional               | Alta      |
| Facturación electrónica            | No implementada           | Requisitos fiscales, proveedor autorizado, numeración y pruebas               | Proveedor tecnológico y asesoría contable | Alta      |
| Almacenamiento externo             | Local                     | Objetos, URLs, permisos, limpieza y migración                                 | Almacenamiento de objetos/CDN             | Alta      |
| Dominio                            | Pendiente                 | Elegir, registrar, configurar DNS y actualizar URLs                           | Registrador opcional                      | Media     |
| WhatsApp Business                  | No implementado           | Alta, consentimiento, plantillas y adaptador                                  | Meta o proveedor autorizado               | Media     |
| SMS                                | No implementado           | Proveedor, consentimiento, presupuesto y límites                              | Proveedor SMS                             | Baja      |
| Monitoreo                          | Básico                    | Errores, disponibilidad, métricas, retención y alertas                        | Servicio de monitoreo opcional            | Alta      |
| Backups                            | Manual/local              | Automatización, cifrado, retención y restauración probada                     | Almacenamiento independiente              | Alta      |
| Textos legales                     | Borradores                | Revisión jurídica, datos reales, responsables y publicación versionada        | Asesoría legal                            | Alta      |
| Información nutricional verificada | Demostrativa/no publicada | Fuentes, análisis o validación competente y aprobación                        | Laboratorio o profesional competente      | Alta      |

## Criterios antes de activar integraciones

- Costos y límites actuales verificados.
- Manejo de datos y contratos revisados.
- Ambiente de prueba disponible.
- Secretos almacenados en la plataforma, nunca en el repositorio.
- Plan de salida o migración del proveedor.
- Pruebas de errores, reintentos e idempotencia.
