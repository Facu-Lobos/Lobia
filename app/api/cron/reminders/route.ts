import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/reminders";

// Pensado para ser llamado por un scheduler externo (Vercel Cron,
// cron-job.org, GitHub Actions, etc.) — Next.js no trae uno propio.
// Protegido con CRON_SECRET para que no sea un endpoint público abierto.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await sendDueReminders();
  return NextResponse.json(result);
}
