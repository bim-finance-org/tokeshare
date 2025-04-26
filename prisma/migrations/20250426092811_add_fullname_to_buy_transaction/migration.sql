/*
  Warnings:

  - Added the required column `fullName` to the `buy_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- D'abord, ajouter la colonne comme NULL
ALTER TABLE "buy_transactions" ADD COLUMN "fullName" VARCHAR(255);

-- Ensuite, mettre à jour les enregistrements existants avec une valeur par défaut
UPDATE "buy_transactions" SET "fullName" = 'Client' WHERE "fullName" IS NULL;

-- Finalement, modifier la colonne pour qu'elle soit NOT NULL
ALTER TABLE "buy_transactions" ALTER COLUMN "fullName" SET NOT NULL;
