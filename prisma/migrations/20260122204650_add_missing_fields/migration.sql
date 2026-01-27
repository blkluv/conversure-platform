-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Macro" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
