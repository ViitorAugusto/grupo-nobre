-- CreateTable
CREATE TABLE "follow_up_runs" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "generated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_run_items" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "follow_up_run_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_summaries" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follow_up_runs_date_key" ON "follow_up_runs"("date");

-- CreateIndex
CREATE INDEX "follow_up_run_items_run_id_seller_id_idx" ON "follow_up_run_items"("run_id", "seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "follow_up_run_items_run_id_opportunity_id_key" ON "follow_up_run_items"("run_id", "opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "follow_up_summaries_run_id_seller_id_key" ON "follow_up_summaries"("run_id", "seller_id");

-- AddForeignKey
ALTER TABLE "follow_up_run_items" ADD CONSTRAINT "follow_up_run_items_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "follow_up_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_run_items" ADD CONSTRAINT "follow_up_run_items_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_run_items" ADD CONSTRAINT "follow_up_run_items_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_summaries" ADD CONSTRAINT "follow_up_summaries_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "follow_up_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_summaries" ADD CONSTRAINT "follow_up_summaries_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
