/*
  Warnings:

  - Added the required column `fiatCurrency` to the `buy_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cryptoCurrency` to the `sell_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- D'abord ajouter avec une valeur par défaut temporaire pour les lignes existantes
ALTER TABLE "buy_transactions" ADD COLUMN "fiatCurrency" VARCHAR(10) NOT NULL DEFAULT 'GBP',
ALTER COLUMN "fees" DROP DEFAULT;

-- Update des valeurs existantes
UPDATE "buy_transactions" SET "fiatCurrency" = 'GBP';

-- Suppression de la valeur par défaut après la mise à jour
ALTER TABLE "buy_transactions" ALTER COLUMN "fiatCurrency" DROP DEFAULT;

-- AlterTable
-- D'abord ajouter avec une valeur par défaut temporaire pour les lignes existantes
ALTER TABLE "sell_transactions" ADD COLUMN "cryptoCurrency" VARCHAR(10) NOT NULL DEFAULT 'TGG',
ALTER COLUMN "fees" DROP DEFAULT;

-- Update des valeurs existantes
UPDATE "sell_transactions" SET "cryptoCurrency" = 'TGG';

-- Suppression de la valeur par défaut après la mise à jour
ALTER TABLE "sell_transactions" ALTER COLUMN "cryptoCurrency" DROP DEFAULT;
