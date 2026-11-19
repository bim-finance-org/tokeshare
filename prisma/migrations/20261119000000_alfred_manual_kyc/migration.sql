-- Alfred removed the API that minted hosted onboarding links: an operator now
-- copies the link from Alfred's dashboard and the app relays it to the user.
ALTER TABLE "AlfredCustomer" ADD COLUMN "kycUrl" TEXT;
ALTER TABLE "AlfredCustomer" ADD COLUMN "kycUrlSetAt" TIMESTAMP(3);
ALTER TABLE "AlfredCustomer" ADD COLUMN "adminNotifiedAt" TIMESTAMP(3);
