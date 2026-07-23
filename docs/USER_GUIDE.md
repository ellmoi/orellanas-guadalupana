# Guía de usuario

## Entrar y crear una cuenta

1. Abre `/registro`.
2. Completa los campos obligatorios y acepta las políticas indicadas.
3. En desarrollo, copia de la consola backend el enlace de verificación.
4. Abre `/iniciar-sesion` e ingresa tus credenciales.

Si olvidas la contraseña, usa `/olvide-contrasena`. El enlace local aparece en consola.

## Comprar

1. Abre `/tienda`.
2. Agrega productos disponibles.
3. Revisa cantidades en `/carrito`.
4. Inicia sesión y abre `/checkout`.
5. Completa contacto, dirección, entrega y método.
6. Confirma el pedido.

Los precios, mínimos y existencias se validan nuevamente en el servidor. “Pago pendiente”, transferencia y contra entrega no equivalen a un pago electrónico confirmado.

## Pedidos

En `/pedidos` puedes consultar tu historial. En el detalle puedes:

- Imprimir el comprobante.
- Descargar PDF.
- Repetir productos disponibles.
- Cancelar cuando el estado lo permita.

El comprobante no es factura electrónica.

## Mi cuenta

Desde `/cuenta/resumen`:

- Edita perfil.
- Gestiona direcciones.
- Consulta pedidos y favoritos.
- Envía solicitudes mayoristas.
- Crea solicitudes de soporte.
- Cambia contraseña o solicita verificación.

## Privacidad y seguridad

- No compartas contraseña ni enlaces de verificación.
- Cierra sesión en equipos compartidos.
- Verifica que la URL y HTTPS sean correctos cuando el sitio sea público.
- No envíes datos de tarjeta por formularios, mensajes o notas.

## Problemas frecuentes

- **No aparecen productos:** puede faltar el seed o conexión con backend.
- **No puedo confirmar:** revisa campos, stock y cantidades mínimas.
- **Sesión vencida:** vuelve a ingresar.
- **No llega correo:** en desarrollo no se envía; revisa la consola.
- **No puedo cancelar:** el pedido ya avanzó a un estado no cancelable.

Para datos o políticas definitivas, consulta los textos publicados por la empresa, no los borradores del repositorio.
