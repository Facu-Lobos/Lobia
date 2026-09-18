import type { DaySlot } from "@/lib/availability";
import type { WeekSchedule } from "@/components/WeeklyHoursStrip";
import { WeeklyHoursStrip } from "@/components/WeeklyHoursStrip";
import { DaySlotGrid } from "@/components/DaySlotGrid";

type QueueAction = (formData: FormData) => void | Promise<void>;

export type ProfessionalDayData = {
  professional: { id: string; fullName: string };
  slots: DaySlot[];
  schedules: WeekSchedule;
};

// Vista "Todos los profesionales": la misma grilla horaria que usa un
// profesional para su propio día, una sección por cada uno, para que
// secretaría/encargado/admin puedan ver todos los médicos a la vez.
export function MultiProfessionalGrid({
  data,
  returnTo,
  markArrivedAction,
  markCalledAction,
  markCompletedAction,
}: {
  data: ProfessionalDayData[];
  returnTo: string;
  markArrivedAction: QueueAction;
  markCalledAction: QueueAction;
  markCompletedAction: QueueAction;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-sm text-muted">No hay profesionales cargados.</p>;
  }

  return (
    <div className="space-y-8">
      {data.map(({ professional, slots, schedules }) => (
        <div key={professional.id}>
          <h3 className="font-medium">{professional.fullName}</h3>
          <div className="mt-2">
            <WeeklyHoursStrip schedules={schedules} />
          </div>
          <div className="mt-3">
            <DaySlotGrid
              slots={slots}
              returnTo={returnTo}
              markArrivedAction={markArrivedAction}
              markCalledAction={markCalledAction}
              markCompletedAction={markCompletedAction}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
