-- AlterTable: email pasa a ser opcional (solo paciente/especialista lo usan)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: username, para el login de secretaria/encargado/admin
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
