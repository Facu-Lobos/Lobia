import "server-only";
import { prisma } from "@/lib/prisma";

export type ChargeItemInput = {
  nomencladorId: string | null;
  description: string;
  quantity: number;
  unitValue: number;
};

export type ChargeAppointmentInput = {
  appointmentId: string;
  patientId: string;
  institutionId: string;
  userId: string;
  items: ChargeItemInput[];
  paymentMethod: "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
};

export type ChargeAppointmentResult =
  | { ok: true; invoiceId: string; amount: number }
  | { ok: false; error: "sin_caja" | "sin_items" | "invalido" };

// Se llama al confirmar el modal de "Cobrar" en la grilla: exige una caja
// abierta (si no hay, no se puede cobrar — evita plata suelta sin
// trazabilidad) y reemplaza los renglones del comprobante del turno
// (a lo sumo uno por turno, igual que "Generar comprobante").
export async function chargeAppointment(
  input: ChargeAppointmentInput
): Promise<ChargeAppointmentResult> {
  const items = input.items.filter(
    (i) => i.description.trim() && i.quantity > 0
  );
  if (items.length === 0) {
    return { ok: false, error: "sin_items" };
  }

  const openCaja = await prisma.caja.findFirst({
    where: { institutionId: input.institutionId, closedAt: null },
  });
  if (!openCaja) {
    return { ok: false, error: "sin_caja" };
  }

  const amount = items.reduce((sum, i) => sum + i.quantity * i.unitValue, 0);
  const concept =
    items.length === 1
      ? items[0].description
      : `${items.length} ítems (nomenclador)`;

  const invoice = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoice.findUnique({
      where: { appointmentId: input.appointmentId },
    });

    const data = {
      patientId: input.patientId,
      concept,
      amount,
      paymentMethod: input.paymentMethod,
      cajaId: openCaja.id,
      createdById: input.userId,
    };

    const inv = existing
      ? await tx.invoice.update({ where: { id: existing.id }, data })
      : await tx.invoice.create({
          data: { ...data, appointmentId: input.appointmentId },
        });

    await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
    await tx.invoiceItem.createMany({
      data: items.map((i) => ({
        invoiceId: inv.id,
        nomencladorId: i.nomencladorId,
        description: i.description,
        quantity: i.quantity,
        unitValue: i.unitValue,
        subtotal: i.quantity * i.unitValue,
      })),
    });

    return inv;
  });

  return { ok: true, invoiceId: invoice.id, amount };
}

// Para pintar "$1500" en vez de sólo el nombre en la grilla, sin traer los
// renglones de cada comprobante (eso se carga recién al abrir el modal).
export async function getChargesMapForAppointments(
  appointmentIds: string[]
): Promise<Record<string, number>> {
  if (appointmentIds.length === 0) return {};
  const invoices = await prisma.invoice.findMany({
    where: { appointmentId: { in: appointmentIds } },
    select: { appointmentId: true, amount: true },
  });
  return Object.fromEntries(
    invoices
      .filter((i) => i.appointmentId)
      .map((i) => [i.appointmentId as string, i.amount])
  );
}

export async function getAppointmentCharge(appointmentId: string) {
  return prisma.invoice.findUnique({
    where: { appointmentId },
    include: { items: true },
  });
}
