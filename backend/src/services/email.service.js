import { env } from '../config/env.js';

/**
 * En desarrollo el enlace se imprime en consola. TODO: implementar un
 * transportador Nodemailer real cuando se configure un proveedor de correo.
 */
export async function sendDevelopmentLink({ recipient, subject, link }) {
  if (env.emailMode !== 'console') {
    console.warn('TODO: EMAIL_MODE no es console, pero aún no existe un proveedor de correo real.');
    return;
  }
  console.log(`\n[EMAIL_MODE=console] ${subject}`);
  console.log(`Para: ${recipient}`);
  console.log(`Enlace: ${link}\n`);
}
