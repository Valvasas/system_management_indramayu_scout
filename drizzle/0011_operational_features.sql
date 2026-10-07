CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'EXCUSED', 'ABSENT');--> statement-breakpoint
CREATE TYPE "public"."competency_kind" AS ENUM('SKU', 'SKK');--> statement-breakpoint
CREATE TYPE "public"."internal_doc_category" AS ENUM('SK', 'SURAT', 'FORMULIR', 'LAPORAN', 'LAINNYA');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('ANNOUNCEMENT', 'NEWS_REVIEW', 'NEWS_RETURNED', 'NEWS_PUBLISHED', 'TRANSFER_REQUESTED', 'TRANSFER_DECIDED', 'ACCESS_REQUEST', 'CONSENT_DECIDED', 'EVENT_REGISTRATION', 'TERM_ENDING', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('LOW', 'NORMAL', 'HIGH');--> statement-breakpoint
CREATE TABLE "competency_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "competency_kind" NOT NULL,
	"golongan" "golongan" NOT NULL,
	"level" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"note" text,
	"recorded_by_id" uuid,
	"recorded_by_name" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_document_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"user_id" uuid,
	"user_name" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"note" text,
	"uploaded_by_id" uuid,
	"uploaded_by_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" "internal_doc_category" NOT NULL,
	"description" text,
	"allowed_roles" "role"[] NOT NULL,
	"kwarran_id" uuid,
	"gudep_id" uuid,
	"current_version" integer DEFAULT 0 NOT NULL,
	"created_by_id" uuid,
	"created_by_name" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by_id" uuid,
	"verified_by_name" text NOT NULL,
	"note" text,
	"revoked_at" timestamp with time zone,
	"revoked_by_name" text
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_kind_pk" PRIMARY KEY("user_id","kind")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"href" text,
	"dedupe_key" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"position" text NOT NULL,
	"kwarran_id" uuid,
	"gudep_id" uuid,
	"term_start" date,
	"term_end" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_members" ADD COLUMN "term_start" date;--> statement-breakpoint
ALTER TABLE "board_members" ADD COLUMN "term_end" date;--> statement-breakpoint
ALTER TABLE "board_members" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_document_downloads" ADD CONSTRAINT "internal_document_downloads_document_id_internal_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."internal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_document_downloads" ADD CONSTRAINT "internal_document_downloads_version_id_internal_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."internal_document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_document_versions" ADD CONSTRAINT "internal_document_versions_document_id_internal_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."internal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_documents" ADD CONSTRAINT "internal_documents_kwarran_id_kwarran_id_fk" FOREIGN KEY ("kwarran_id") REFERENCES "public"."kwarran"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_documents" ADD CONSTRAINT "internal_documents_gudep_id_gudep_id_fk" FOREIGN KEY ("gudep_id") REFERENCES "public"."gudep"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_competencies" ADD CONSTRAINT "member_competencies_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_competencies" ADD CONSTRAINT "member_competencies_requirement_id_competency_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."competency_requirements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_kwarran_id_kwarran_id_fk" FOREIGN KEY ("kwarran_id") REFERENCES "public"."kwarran"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_gudep_id_gudep_id_fk" FOREIGN KEY ("gudep_id") REFERENCES "public"."gudep"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competency_code_uq" ON "competency_requirements" USING btree ("code");--> statement-breakpoint
CREATE INDEX "competency_golongan_idx" ON "competency_requirements" USING btree ("golongan","kind","level");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_event_member_uq" ON "event_attendance" USING btree ("event_id","member_id");--> statement-breakpoint
CREATE INDEX "attendance_member_idx" ON "event_attendance" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "internal_doc_downloads_idx" ON "internal_document_downloads" USING btree ("document_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "internal_doc_version_uq" ON "internal_document_versions" USING btree ("document_id","version");--> statement-breakpoint
CREATE INDEX "internal_docs_category_idx" ON "internal_documents" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "member_competency_uq" ON "member_competencies" USING btree ("member_id","requirement_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_uq" ON "notifications" USING btree ("user_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "staff_assignments_user_idx" ON "staff_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_assignments_end_idx" ON "staff_assignments" USING btree ("term_end");