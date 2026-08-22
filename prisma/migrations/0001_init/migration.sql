-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PayeeCategory" AS ENUM ('SCHOOL', 'LANDLORD', 'HOSPITAL', 'UTILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('PENDING', 'CLAIMED', 'REJECTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Payee" (
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PayeeCategory" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payee_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Remittance" (
    "id" INTEGER NOT NULL,
    "sender" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "RemittanceStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL,
    "sentTx" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3),
    "settledTx" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remittance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerCursor" (
    "contractId" TEXT NOT NULL,
    "lastLedger" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerCursor_pkey" PRIMARY KEY ("contractId")
);

-- CreateIndex
CREATE INDEX "Payee_category_idx" ON "Payee"("category");

-- CreateIndex
CREATE INDEX "Payee_verified_idx" ON "Payee"("verified");

-- CreateIndex
CREATE INDEX "Remittance_sender_idx" ON "Remittance"("sender");

-- CreateIndex
CREATE INDEX "Remittance_payee_idx" ON "Remittance"("payee");

-- CreateIndex
CREATE INDEX "Remittance_status_idx" ON "Remittance"("status");

