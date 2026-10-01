import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import {
  ALL_INSTITUTIONS_CHANNEL,
  TURNOS_CHANGED_EVENT,
  turnosChannelName,
} from "@/lib/realtime-channels";

// Avisa por Supabase Realtime (broadcast) que cambió algo en los turnos de
// la institución, para que llamador y sala de espera abiertos se refresquen
// solos (ver RealtimeRefresh). El mensaje no lleva datos de pacientes: sólo
// "algo cambió"; cada pantalla vuelve a pedir sus datos con su propia sesión.
// Se manda en `after` para no demorar la respuesta de la acción, y nunca
// rompe la acción si Supabase falla.
async function broadcast(channelName: string) {
  const channel = supabaseAdmin.channel(channelName);
  try {
    const result = await channel.httpSend(TURNOS_CHANGED_EVENT, {});
    if (!result.success) {
      console.error(`[realtime] ${channelName}: ${result.status} ${result.error}`);
    }
  } catch (err) {
    console.error(`[realtime] ${channelName}:`, err);
  } finally {
    await supabaseAdmin.removeChannel(channel);
  }
}

// Siempre avisa también al canal "todas", que es el que escuchan las
// pantallas sin institución fija (admin, /llamador sin slug).
async function broadcastTurnosChanged(institutionId: string | null) {
  const channels = [ALL_INSTITUTIONS_CHANNEL];
  if (institutionId) channels.push(turnosChannelName(institutionId));
  await Promise.all(channels.map(broadcast));
}

export function notifyTurnosChanged(institutionId: string | null) {
  after(() => broadcastTurnosChanged(institutionId));
}

export function notifyTurnosChangedForProfessional(professionalId: string) {
  after(async () => {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { institutionId: true },
    });
    await broadcastTurnosChanged(professional?.institutionId ?? null);
  });
}

export function notifyTurnosChangedForAppointment(appointmentId: string) {
  after(async () => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { professional: { select: { institutionId: true } } },
    });
    await broadcastTurnosChanged(appointment?.professional.institutionId ?? null);
  });
}
