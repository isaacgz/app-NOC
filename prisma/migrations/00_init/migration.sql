-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SLOWindow" AS ENUM ('1h', '24h', '7d', '30d', '90d');

-- CreateEnum
CREATE TYPE "SLIType" AS ENUM ('AVAILABILITY', 'LATENCY', 'ERROR_RATE');

-- CreateEnum
CREATE TYPE "ViolationRisk" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateTable
CREATE TABLE "services" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(1024) NOT NULL,
    "method" VARCHAR(50) NOT NULL DEFAULT 'http',
    "interval" VARCHAR(255) NOT NULL DEFAULT '*/30 * * * * *',
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "healthCheck" JSONB,
    "alertConfig" JSONB,
    "last_check_at" TIMESTAMP(3),
    "last_status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" VARCHAR(255) NOT NULL,
    "service_id" VARCHAR(255) NOT NULL,
    "service_name" VARCHAR(255) NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_impact" TEXT,
    "affected_checks" INTEGER NOT NULL DEFAULT 0,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "resolution_time_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slos" (
    "id" VARCHAR(255) NOT NULL,
    "service_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target" DECIMAL(5,2) NOT NULL,
    "window" "SLOWindow" NOT NULL,
    "sli_type" "SLIType" NOT NULL,
    "threshold" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "current_value" DECIMAL(5,2),
    "compliance" BOOLEAN,
    "error_budget" DECIMAL(10,2),
    "error_budget_used" DECIMAL(5,2),
    "burn_rate" DECIMAL(5,2),
    "violation_risk" "ViolationRisk",
    "last_calculated_at" TIMESTAMP(3),
    "alert_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slo_status_history" (
    "id" TEXT NOT NULL,
    "slo_id" VARCHAR(255) NOT NULL,
    "slo_name" VARCHAR(255) NOT NULL,
    "service_id" VARCHAR(255) NOT NULL,
    "service_name" VARCHAR(255) NOT NULL,
    "current_value" DECIMAL(5,2) NOT NULL,
    "target" DECIMAL(5,2) NOT NULL,
    "compliance" BOOLEAN NOT NULL,
    "error_budget" DECIMAL(10,2) NOT NULL,
    "error_budget_total" DECIMAL(10,2) NOT NULL,
    "error_budget_used" DECIMAL(5,2) NOT NULL,
    "burn_rate" DECIMAL(5,2) NOT NULL,
    "violation_risk" "ViolationRisk" NOT NULL,
    "window" "SLOWindow" NOT NULL,
    "sli_type" "SLIType" NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slo_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_service_id_idx" ON "incidents"("service_id");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_created_at_idx" ON "incidents"("created_at");

-- CreateIndex
CREATE INDEX "slos_service_id_idx" ON "slos"("service_id");

-- CreateIndex
CREATE INDEX "slos_enabled_idx" ON "slos"("enabled");

-- CreateIndex
CREATE INDEX "slo_status_history_slo_id_idx" ON "slo_status_history"("slo_id");

-- CreateIndex
CREATE INDEX "slo_status_history_calculated_at_idx" ON "slo_status_history"("calculated_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slos" ADD CONSTRAINT "slos_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
