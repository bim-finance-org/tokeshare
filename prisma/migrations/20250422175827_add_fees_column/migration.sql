-- AlterTable
ALTER TABLE "buy_transactions" ADD COLUMN     "fees" DECIMAL(18,8) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sell_transactions" ADD COLUMN     "fees" DECIMAL(18,2) NOT NULL DEFAULT 0;
