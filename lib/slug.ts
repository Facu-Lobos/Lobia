// Convierte "Clínica del Sol" -> "clinica-del-sol", para URLs públicas del
// llamador (/llamador/<slug>). No se persiste — se compara al vuelo contra
// el nombre de cada institución.
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
