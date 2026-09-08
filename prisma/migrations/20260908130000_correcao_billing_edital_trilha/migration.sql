-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "EditalStatus" AS ENUM ('PENDENTE', 'EXTRAINDO_TEXTO', 'PARSEANDO_IA', 'CONCLUIDO', 'ERRO');

-- CreateEnum
CREATE TYPE "ScheduleEventKind" AS ENUM ('INSCRICAO', 'PROVA_OBJETIVA', 'PROVA_DISCURSIVA', 'GABARITO', 'RECURSO', 'RESULTADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TrilhaStatus" AS ENUM ('ATIVA', 'CONCLUIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "TrilhaItemStatus" AS ENUM ('PENDENTE', 'CONCLUIDO', 'PULADO');

-- AlterTable
ALTER TABLE "StudySession" ADD COLUMN     "trilhaItemId" TEXT;

-- CreateTable
CREATE TABLE "AICorrection" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "monthlyPriceUsdCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edital" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "status" "EditalStatus" NOT NULL DEFAULT 'PENDENTE',
    "errorMessage" TEXT,
    "rawText" TEXT,
    "parsedJson" JSONB,
    "orgao" TEXT,
    "cargo" TEXT,
    "examDate" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3),
    "resultDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsedAt" TIMESTAMP(3),

    CONSTRAINT "Edital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditalSubject" (
    "id" TEXT NOT NULL,
    "editalId" TEXT NOT NULL,
    "block" "SubjectBlock" NOT NULL,
    "name" TEXT NOT NULL,
    "numQuestions" INTEGER,
    "weight" DOUBLE PRECISION,

    CONSTRAINT "EditalSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditalScheduleEvent" (
    "id" TEXT NOT NULL,
    "editalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "kind" "ScheduleEventKind" NOT NULL DEFAULT 'OUTRO',

    CONSTRAINT "EditalScheduleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trilha" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editalId" TEXT,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "status" "TrilhaStatus" NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trilha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrilhaItem" (
    "id" TEXT NOT NULL,
    "trilhaId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "subjectId" TEXT,
    "intensity" "StudyIntensity" NOT NULL DEFAULT 'CURTA',
    "status" "TrilhaItemStatus" NOT NULL DEFAULT 'PENDENTE',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrilhaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AICorrection_answerId_key" ON "AICorrection"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_key_key" ON "PlanFeature"("planId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Edital_userId_status_idx" ON "Edital"("userId", "status");

-- CreateIndex
CREATE INDEX "EditalSubject_editalId_idx" ON "EditalSubject"("editalId");

-- CreateIndex
CREATE INDEX "EditalScheduleEvent_editalId_idx" ON "EditalScheduleEvent"("editalId");

-- CreateIndex
CREATE INDEX "Trilha_userId_status_idx" ON "Trilha"("userId", "status");

-- CreateIndex
CREATE INDEX "TrilhaItem_trilhaId_scheduledDate_idx" ON "TrilhaItem"("trilhaId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_trilhaItemId_fkey" FOREIGN KEY ("trilhaItemId") REFERENCES "TrilhaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICorrection" ADD CONSTRAINT "AICorrection_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edital" ADD CONSTRAINT "Edital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditalSubject" ADD CONSTRAINT "EditalSubject_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditalScheduleEvent" ADD CONSTRAINT "EditalScheduleEvent_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trilha" ADD CONSTRAINT "Trilha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trilha" ADD CONSTRAINT "Trilha_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrilhaItem" ADD CONSTRAINT "TrilhaItem_trilhaId_fkey" FOREIGN KEY ("trilhaId") REFERENCES "Trilha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

