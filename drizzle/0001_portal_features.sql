CREATE TYPE "public"."access_code_purpose" AS ENUM('ACTIVATION', 'RESET');--> statement-breakpoint
CREATE TYPE "public"."reset_request_status" AS ENUM('OPEN', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "public"."publish_status" ADD VALUE 'REVIEW' BEFORE 'PUBLISHED';--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" "access_code_purpose" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"from_gudep_id" uuid NOT NULL,
	"to_gudep_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "transfer_status" DEFAULT 'REQUESTED' NOT NULL,
	"requested_by_id" uuid,
	"requested_by_name" text NOT NULL,
	"decided_by_id" uuid,
	"decided_by_name" text,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "reset_request_status" DEFAULT 'OPEN' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_from_gudep_id_gudep_id_fk" FOREIGN KEY ("from_gudep_id") REFERENCES "public"."gudep"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_to_gudep_id_gudep_id_fk" FOREIGN KEY ("to_gudep_id") REFERENCES "public"."gudep"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_codes_user_idx" ON "access_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transfers_member_idx" ON "member_transfers" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "transfers_status_idx" ON "member_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reset_requests_status_idx" ON "password_reset_requests" USING btree ("status","created_at");