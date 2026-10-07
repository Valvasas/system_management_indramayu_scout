CREATE TYPE "public"."consent_method" AS ENUM('GUARDIAN_CODE', 'STAFF_REVOCATION', 'LEGACY_MANUAL');--> statement-breakpoint
CREATE TYPE "public"."consent_scope" AS ENUM('DATA', 'PHOTO', 'ACTIVITY');--> statement-breakpoint
CREATE TABLE "guardian_consent_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"requested_by_id" uuid,
	"requested_by_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"request_id" uuid,
	"scope" "consent_scope" NOT NULL,
	"granted" boolean NOT NULL,
	"text_version" text NOT NULL,
	"method" "consent_method" NOT NULL,
	"guardian_name" text,
	"ip_hash" text,
	"recorded_by_id" uuid,
	"recorded_by_name" text,
	"note" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guardian_consent_requests" ADD CONSTRAINT "guardian_consent_requests_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_consents" ADD CONSTRAINT "guardian_consents_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_consents" ADD CONSTRAINT "guardian_consents_request_id_guardian_consent_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."guardian_consent_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_requests_member_idx" ON "guardian_consent_requests" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "consents_member_scope_idx" ON "guardian_consents" USING btree ("member_id","scope","decided_at");