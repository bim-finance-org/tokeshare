-- Give the newsletter table a surrogate primary key and an audit timestamp,
-- and keep the email address as a unique constraint (was the primary key).
ALTER TABLE "Emails" DROP CONSTRAINT "Emails_pkey";

ALTER TABLE "Emails" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "Emails" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Emails" ADD CONSTRAINT "Emails_pkey" PRIMARY KEY ("id");
ALTER TABLE "Emails" ADD CONSTRAINT "Emails_email_key" UNIQUE ("email");
