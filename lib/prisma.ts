import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Supabase pooler (session mode) sólo admite 15 conexiones totales para
  // todo el proyecto — un `max` bajo evita que esta sola instancia se
  // quede con la mayoría, y un idleTimeout corto libera conexiones ociosas
  // rápido (importante en dev, con hot-reload y varias pestañas abiertas).
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
