import "server-only";
import nodemailer from "nodemailer";

// Si no hay SMTP configurado (dev / sin credenciales todavía), el envío se
// loguea en consola en lugar de fallar, para poder probar el flujo completo
// de recordatorios sin depender de un proveedor real.
function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const transport = getTransport();

  if (!transport) {
    console.log(`[email:dev] Para: ${to} | Asunto: ${subject}\n${text}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}
