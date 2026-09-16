import "server-only";
import { prisma } from "@/lib/prisma";

export async function professionalInInstitution(
  professionalId: string,
  institutionId: string
): Promise<boolean> {
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, institutionId },
    select: { id: true },
  });
  return !!professional;
}

export async function appointmentInInstitution(
  appointmentId: string,
  institutionId: string
): Promise<boolean> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, professional: { institutionId } },
    select: { id: true },
  });
  return !!appointment;
}
