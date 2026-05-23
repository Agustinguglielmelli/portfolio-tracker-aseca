-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "BatchLog" (
    "id" SERIAL NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tickersProcessed" INTEGER NOT NULL,
    "success" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "BatchLog_pkey" PRIMARY KEY ("id")
);
