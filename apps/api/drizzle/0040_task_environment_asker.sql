ALTER TABLE "task" ADD COLUMN "environment" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "asker_email" text DEFAULT 'julienlelandais@me.com';--> statement-breakpoint
UPDATE "task" SET "asker_email" = 'julienlelandais@me.com' WHERE "asker_email" IS NULL;
