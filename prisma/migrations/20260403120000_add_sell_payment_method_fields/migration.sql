-- AlterTable
ALTER TABLE "sell_transactions" ALTER COLUMN "iban" DROP NOT NULL;

-- AddColumns
ALTER TABLE "sell_transactions" ADD COLUMN "paymentMethod" VARCHAR(20);
ALTER TABLE "sell_transactions" ADD COLUMN "walletAddress" VARCHAR(255);
ALTER TABLE "sell_transactions" ADD COLUMN "txHash" VARCHAR(66);
ALTER TABLE "sell_transactions" ADD COLUMN "usdcTxHash" VARCHAR(66);
