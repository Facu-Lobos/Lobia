// Si el nombre del profesional ya arranca con "Dr."/"Dra." (como se cargan
// algunos), lo saca — el llamador antepone su propio "Dr/Dra" fijo antes
// del nombre, así que no hay que duplicarlo.
export function stripProfessionalTitle(name: string): string {
  return name.replace(/^dra?\.?\s+/i, "").trim();
}
