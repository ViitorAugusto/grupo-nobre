-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('PRIMEIRO_CONTATO', 'APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FORECAST', 'FECHAMENTO', 'PERDIDA');

-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('PRECO', 'PRAZO', 'CONCORRENCIA', 'CLIENTE_DESISTIU', 'SEM_RESPOSTA', 'OUTRO', 'NAO_REGISTRADO');

-- CreateTable
CREATE TABLE "sellers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "seller_id" UUID NOT NULL,
    "stage" "Stage" NOT NULL,
    "estimated_value" DECIMAL(12,2),
    "last_contact_date" DATE,
    "proposal_valid_until" DATE,
    "event_date" DATE,
    "loss_reason" "LossReason",
    "loss_reason_text" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_items" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "product" VARCHAR(120) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "opportunity_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_history" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "from_stage" "Stage" NOT NULL,
    "to_stage" "Stage" NOT NULL,
    "loss_reason" "LossReason",
    "loss_reason_text" VARCHAR(500),
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sellers_name_key" ON "sellers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_code_key" ON "opportunities"("code");

-- CreateIndex
CREATE INDEX "opportunities_seller_id_idx" ON "opportunities"("seller_id");

-- CreateIndex
CREATE INDEX "opportunities_stage_idx" ON "opportunities"("stage");

-- CreateIndex
CREATE INDEX "opportunity_items_opportunity_id_idx" ON "opportunity_items"("opportunity_id");

-- CreateIndex
CREATE INDEX "stage_history_opportunity_id_changed_at_idx" ON "stage_history"("opportunity_id", "changed_at");

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_items" ADD CONSTRAINT "opportunity_items_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
