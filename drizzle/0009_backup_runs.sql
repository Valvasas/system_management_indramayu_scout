CREATE TYPE "public"."backup_status" AS ENUM('RUNNING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TABLE "backup_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "backup_status" DEFAULT 'RUNNING' NOT NULL,
	"kind" text NOT NULL,
	"file_name" text,
	"size_bytes" bigint,
	"sha256" text,
	"verified_at" timestamp with time zone,
	"verify_note" text,
	"triggered_by_id" uuid,
	"triggered_by_name" text NOT NULL,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "backup_runs_started_idx" ON "backup_runs" USING btree ("started_at");