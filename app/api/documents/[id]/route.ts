import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { readDocumentFile } from "@/lib/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;

  const document = await prisma.patientDocument.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const isOwner = user.role === "PATIENT" && document.patientId === user.id;
  const isStaff = ["ADMIN", "MANAGER", "SECRETARY", "SPECIALIST"].includes(
    user.role
  );
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const bytes = await readDocumentFile(document.storagePath);
  const contentType = document.mimeType.startsWith("text/")
    ? `${document.mimeType}; charset=utf-8`
    : document.mimeType;

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${document.fileName}"`,
    },
  });
}
