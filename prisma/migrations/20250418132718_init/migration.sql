-- CreateTable
CREATE TABLE "Emails" (
    "email" TEXT NOT NULL,

    CONSTRAINT "Emails_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "sell_transactions" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "iban" VARCHAR(34) NOT NULL,
    "blockchain" VARCHAR(50) NOT NULL,
    "fiat" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "ref" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,

    CONSTRAINT "sell_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buy_transactions" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "walletAddress" VARCHAR(255) NOT NULL,
    "blockchain" VARCHAR(50) NOT NULL,
    "crypto" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "ref" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "cvu" VARCHAR(50) NOT NULL,

    CONSTRAINT "buy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sell_transactions_ref_key" ON "sell_transactions"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "buy_transactions_ref_key" ON "buy_transactions"("ref");
