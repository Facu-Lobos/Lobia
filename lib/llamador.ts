import "server-only";
import { prisma } from "@/lib/prisma";
import { toMidnight } from "@/lib/professional-mutations";
import type { PublicCalledAppointment } from "@/components/PublicLlamadorScreen";

// institutionId null = todas las instituciones.
export async function getCalledAppointments(
  institutionId: string | null
): Promise<PublicCalledAppointment[]> {
  const todayStart = toMidnight(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "BOOKED",
      calledAt: { gte: todayStart, lt: todayEnd },
      completedAt: null,
      ...(institutionId ? { professional: { institutionId } } : {}),
    },
    include: { professional: true, patient: true },
    orderBy: { calledAt: "desc" },
  });

  return appointments.map((a) => ({
    id: a.id,
    patientName: a.patient.name,
    professionalName: a.professional.fullName,
    consultingRoom: a.professional.consultingRoom,
    calledAt: a.calledAt!,
  }));
}
