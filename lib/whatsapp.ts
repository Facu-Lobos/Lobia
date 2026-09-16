const DEFAULT_TEMPLATE =
  "Hola {paciente}, te escribimos por tu turno del {fecha} a las {hora}.";

export function buildWhatsAppLink({
  phone,
  template,
  paciente,
  fecha,
  hora,
}: {
  phone: string | null | undefined;
  template: string | null | undefined;
  paciente: string;
  fecha: string;
  hora: string;
}): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const text = (template || DEFAULT_TEMPLATE)
    .replaceAll("{paciente}", paciente)
    .replaceAll("{fecha}", fecha)
    .replaceAll("{hora}", hora);

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
