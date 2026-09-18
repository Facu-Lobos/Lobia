import { getCalledAppointments } from "@/lib/llamador";
import { PublicLlamadorScreen } from "@/components/PublicLlamadorScreen";

// Pública, sin login: pensada para dejar abierta en un TV/monitor en la
// sala de espera física. No aparece en el menú de ningún rol. Sin
// institución en la URL muestra las de todas las sedes juntas — para una
// sede puntual, usar /llamador/<slug-de-la-institución> en su lugar.
// noindex para que no termine indexada con nombres de pacientes.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicLlamadorPage() {
  const appointments = await getCalledAppointments(null);
  return <PublicLlamadorScreen appointments={appointments} />;
}
