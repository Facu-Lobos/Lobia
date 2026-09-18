import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { getCalledAppointments } from "@/lib/llamador";
import { PublicLlamadorScreen } from "@/components/PublicLlamadorScreen";

export const metadata = {
  robots: { index: false, follow: false },
};

// /llamador/clinica-del-sol, /llamador/sede-norte, etc. — el slug se arma
// al vuelo a partir del nombre de la institución (sin persistirlo), así
// que alcanza con crear la institución para que su URL funcione sola.
export default async function PublicLlamadorPorInstitucionPage({
  params,
}: {
  params: Promise<{ institucion: string }>;
}) {
  const { institucion: institucionSlug } = await params;

  const institutions = await prisma.institution.findMany({
    where: { active: true },
  });
  const institution = institutions.find(
    (i) => slugify(i.name) === institucionSlug
  );
  if (!institution) notFound();

  const appointments = await getCalledAppointments(institution.id);
  return <PublicLlamadorScreen appointments={appointments} />;
}
