/*
  Warnings:

  - You are about to drop the column `amount` on the `buy_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `fiatCurrency` on the `buy_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `fees` on the `buy_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,8)` to `Decimal(18,4)`.
  - You are about to drop the column `amount` on the `sell_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `cryptoCurrency` on the `sell_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `fees` on the `sell_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(18,4)`.
  - Added the required column `cryptoAmount` to the `buy_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiat` to the `buy_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiatAmount` to the `buy_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crypto` to the `sell_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cryptoAmount` to the `sell_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiatAmount` to the `sell_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "buy_transactions" DROP COLUMN "amount",
DROP COLUMN "fiatCurrency",
ADD COLUMN     "cryptoAmount" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "fiat" VARCHAR(10) NOT NULL,
ADD COLUMN     "fiatAmount" DECIMAL(18,4) NOT NULL,
ALTER COLUMN "fees" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "sell_transactions" DROP COLUMN "amount",
DROP COLUMN "cryptoCurrency",
ADD COLUMN     "crypto" VARCHAR(10) NOT NULL,
ADD COLUMN     "cryptoAmount" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "fiatAmount" DECIMAL(18,4) NOT NULL,
ALTER COLUMN "fees" SET DATA TYPE DECIMAL(18,4);
