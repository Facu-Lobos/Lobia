import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@turnos.local" },
    update: {},
    create: {
      email: "admin@turnos.local",
      passwordHash: adminPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  const institutionNames = ["Sede Centro", "Sede Norte"];
  const institutions = await Promise.all(
    institutionNames.map((name) =>
      prisma.institution.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  const sedeCentro = institutions.find((i) => i.name === "Sede Centro")!;
  const sedeNorte = institutions.find((i) => i.name === "Sede Norte")!;

  const specialtyNames = [
    "Clínica Médica",
    "Pediatría",
    "Cardiología",
    "Dermatología",
  ];
  const specialties = await Promise.all(
    specialtyNames.map((name) =>
      prisma.specialty.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const professionalsData = [
    {
      fullName: "Dra. Marina Sosa",
      bio: "Especialista en clínica médica con 15 años de experiencia.",
      specialty: "Clínica Médica",
      institution: sedeCentro,
    },
    {
      fullName: "Dr. Ezequiel Ferreyra",
      bio: "Pediatra, atiende niños y adolescentes.",
      specialty: "Pediatría",
      institution: sedeCentro,
    },
    {
      fullName: "Dra. Lucía Beltrán",
      bio: "Cardióloga, especializada en prevención cardiovascular.",
      specialty: "Cardiología",
      institution: sedeNorte,
    },
    {
      fullName: "Dr. Tomás Ibarra",
      bio: "Dermatólogo clínico y estético.",
      specialty: "Dermatología",
      institution: sedeNorte,
    },
  ];

  for (const data of professionalsData) {
    const specialty = specialties.find((s) => s.name === data.specialty)!;

    const existing = await prisma.professional.findFirst({
      where: { fullName: data.fullName },
    });

    const professional =
      existing ??
      (await prisma.professional.create({
        data: {
          fullName: data.fullName,
          bio: data.bio,
          institutionId: data.institution.id,
        },
      }));

    if (existing && !existing.institutionId) {
      await prisma.professional.update({
        where: { id: existing.id },
        data: { institutionId: data.institution.id },
      });
    }

    await prisma.professionalSpecialty.upsert({
      where: {
        professionalId_specialtyId: {
          professionalId: professional.id,
          specialtyId: specialty.id,
        },
      },
      update: {},
      create: {
        professionalId: professional.id,
        specialtyId: specialty.id,
      },
    });

    const existingSchedules = await prisma.scheduleSlot.findMany({
      where: { professionalId: professional.id },
    });

    if (existingSchedules.length === 0) {
      // Lunes, miércoles y viernes de 09:00 a 13:00, turnos de 30 min
      await prisma.scheduleSlot.createMany({
        data: [1, 3, 5].map((dayOfWeek) => ({
          professionalId: professional.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "13:00",
          slotMinutes: 30,
        })),
      });
    }
  }

  // Licencia de ejemplo: Dr. Ezequiel Ferreyra de vacaciones dentro de 5-7 días
  const licensedProfessional = await prisma.professional.findFirst({
    where: { fullName: "Dr. Ezequiel Ferreyra" },
  });
  if (licensedProfessional) {
    const existingLicenses = await prisma.license.findMany({
      where: { professionalId: licensedProfessional.id },
    });
    if (existingLicenses.length === 0) {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      await prisma.license.create({
        data: {
          professionalId: licensedProfessional.id,
          startDate,
          endDate,
          reason: "Vacaciones",
        },
      });
    }
  }

  // Día adicional de ejemplo: Dra. Lucía Beltrán atiende el próximo sábado
  const extraDayProfessional = await prisma.professional.findFirst({
    where: { fullName: "Dra. Lucía Beltrán" },
  });
  if (extraDayProfessional) {
    const existingExtraDays = await prisma.extraDay.findMany({
      where: { professionalId: extraDayProfessional.id },
    });
    if (existingExtraDays.length === 0) {
      const nextSaturday = new Date();
      nextSaturday.setHours(0, 0, 0, 0);
      const daysUntilSaturday = (6 - nextSaturday.getDay() + 7) % 7 || 7;
      nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);

      await prisma.extraDay.create({
        data: {
          professionalId: extraDayProfessional.id,
          date: nextSaturday,
          startTime: "10:00",
          endTime: "14:00",
          slotMinutes: 20,
        },
      });
    }
  }

  const secretaryPassword = await bcrypt.hash("secretaria1234", 10);
  const secretaryUser = await prisma.user.upsert({
    where: { email: "secretaria@turnos.local" },
    update: {},
    create: {
      email: "secretaria@turnos.local",
      passwordHash: secretaryPassword,
      name: "Secretaria",
      role: "SECRETARY",
      institutionId: sedeCentro.id,
    },
  });
  if (!secretaryUser.institutionId) {
    await prisma.user.update({
      where: { id: secretaryUser.id },
      data: { institutionId: sedeCentro.id },
    });
  }

  const managerPassword = await bcrypt.hash("encargado1234", 10);
  await prisma.user.upsert({
    where: { email: "encargado@turnos.local" },
    update: {},
    create: {
      email: "encargado@turnos.local",
      passwordHash: managerPassword,
      name: "Encargado Sede Centro",
      role: "MANAGER",
      institutionId: sedeCentro.id,
    },
  });

  const patientPassword = await bcrypt.hash("paciente1234", 10);
  const testPatient = await prisma.user.upsert({
    where: { email: "paciente@turnos.local" },
    update: {},
    create: {
      email: "paciente@turnos.local",
      passwordHash: patientPassword,
      name: "Paciente de Prueba",
      phone: "5491100000000",
      role: "PATIENT",
    },
  });

  const linkedProfessional = await prisma.professional.findFirst({
    where: { fullName: "Dra. Marina Sosa" },
  });

  if (linkedProfessional && !linkedProfessional.userId) {
    const specialistPassword = await bcrypt.hash("especialista1234", 10);
    const specialistUser = await prisma.user.upsert({
      where: { email: "especialista@turnos.local" },
      update: {},
      create: {
        email: "especialista@turnos.local",
        passwordHash: specialistPassword,
        name: linkedProfessional.fullName,
        role: "SPECIALIST",
      },
    });
    await prisma.professional.update({
      where: { id: linkedProfessional.id },
      data: { userId: specialistUser.id },
    });
  }

  // Mensajes de ejemplo en el profesional-especialista
  if (linkedProfessional && !linkedProfessional.bookingMessage) {
    await prisma.professional.update({
      where: { id: linkedProfessional.id },
      data: {
        bookingMessage:
          "Por favor llegá 10 minutos antes de tu turno con tu DNI.",
        cancelMessage:
          "Si necesitás reprogramar, escribinos por WhatsApp con anticipación.",
        whatsappMessageTemplate:
          "Hola {paciente}, te escribo por tu turno del {fecha} a las {hora} con la Dra. Sosa.",
      },
    });
  }

  // Mercado Pago "conectado" de ejemplo en el profesional-especialista
  if (linkedProfessional && !linkedProfessional.mercadoPagoConnected) {
    await prisma.professional.update({
      where: { id: linkedProfessional.id },
      data: {
        mercadoPagoConnected: true,
        depositAmount: 5000,
      },
    });
  }

  // 2 turnos de ejemplo con Dra. Sosa (uno con llegada marcada, otro sin) para
  // demostrar el estado "llegó" y tener contenido en los calendarios sin
  // tener que reservar a mano.
  if (linkedProfessional) {
    const existingAppointments = await prisma.appointment.findMany({
      where: { professionalId: linkedProfessional.id, patientId: testPatient.id },
    });
    if (existingAppointments.length === 0) {
      const nextWeekday = (targetDay: number) => {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        const diff = (targetDay - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        return d;
      };

      await prisma.appointment.create({
        data: {
          professionalId: linkedProfessional.id,
          patientId: testPatient.id,
          date: nextWeekday(1), // próximo lunes 09:00
          status: "BOOKED",
        },
      });
      await prisma.appointment.create({
        data: {
          professionalId: linkedProfessional.id,
          patientId: testPatient.id,
          date: nextWeekday(3), // próximo miércoles 09:00
          status: "BOOKED",
          arrivedAt: new Date(),
        },
      });
    }
  }

  console.log("Seed completado.");
  console.log("Admin: admin@turnos.local / admin1234");
  console.log("Encargado (Sede Centro): encargado@turnos.local / encargado1234");
  console.log("Especialista: especialista@turnos.local / especialista1234");
  console.log("Secretaria: secretaria@turnos.local / secretaria1234");
  console.log("Paciente: paciente@turnos.local / paciente1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
