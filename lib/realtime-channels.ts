// Nombres de canal compartidos entre el server (lib/realtime.ts) y el
// cliente (components/RealtimeRefresh.tsx).
export const TURNOS_CHANGED_EVENT = "turnos-changed";
export const ALL_INSTITUTIONS_CHANNEL = "turnos:todas";

export function turnosChannelName(institutionId: string | null) {
  return institutionId ? `turnos:${institutionId}` : ALL_INSTITUTIONS_CHANNEL;
}
