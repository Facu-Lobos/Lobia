// Nombre de la cookie que indica que el profesional ya eligió su
// consultorio en esta sesión de navegador. Sin "server-only": la lee tanto
// proxy.ts (Edge) como los server actions (Node).
export const CONSULTORIO_COOKIE = "consultorio_ok";
