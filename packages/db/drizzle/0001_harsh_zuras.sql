CREATE TYPE "public"."body_view" AS ENUM('front', 'side', 'back', 'other');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."relation_status" AS ENUM('pending', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('coach', 'student');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_report_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body_report_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"view_type" "body_view" DEFAULT 'other' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"student_id" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"weight_kg" numeric(6, 2),
	"height_cm" numeric(6, 2),
	"body_fat_percent" numeric(5, 2),
	"muscle_mass_kg" numeric(6, 2),
	"neck_cm" numeric(6, 2),
	"chest_cm" numeric(6, 2),
	"waist_cm" numeric(6, 2),
	"hip_cm" numeric(6, 2),
	"arm_left_cm" numeric(6, 2),
	"arm_right_cm" numeric(6, 2),
	"thigh_left_cm" numeric(6, 2),
	"thigh_right_cm" numeric(6, 2),
	"resting_heart_rate" integer,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"notes" text DEFAULT '' NOT NULL,
	"extra_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" "relation_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"media_type" "media_type" NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"duration_seconds" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"muscle_group" varchar(80) NOT NULL,
	"equipment" varchar(80) DEFAULT 'بدون وسیله' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'beginner' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"phone" varchar(32),
	"timezone" varchar(64) DEFAULT 'Asia/Tehran' NOT NULL,
	"locale" varchar(16) DEFAULT 'fa-IR' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_plan_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_plan_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"day_number" integer NOT NULL,
	"weekday" integer,
	"notes" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_plan_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_plan_day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"exercise_title_snapshot" varchar(120) NOT NULL,
	"exercise_description_snapshot" text DEFAULT '' NOT NULL,
	"sets" integer NOT NULL,
	"reps" varchar(30) NOT NULL,
	"duration_seconds" integer,
	"rest_seconds" integer DEFAULT 60 NOT NULL,
	"target_weight" numeric(7, 2),
	"target_rpe" numeric(3, 1),
	"tempo" varchar(30),
	"notes" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"student_id" text NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "plan_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_session_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_session_id" uuid NOT NULL,
	"workout_plan_exercise_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"actual_sets" integer,
	"actual_reps" varchar(30),
	"actual_weight" numeric(7, 2),
	"actual_duration_seconds" integer,
	"actual_rpe" numeric(3, 1),
	"student_note" text DEFAULT '' NOT NULL,
	"client_mutation_id" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"workout_plan_day_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" "session_status" DEFAULT 'pending' NOT NULL,
	"student_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_report_media" ADD CONSTRAINT "body_report_media_body_report_id_body_reports_id_fk" FOREIGN KEY ("body_report_id") REFERENCES "public"."body_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_reports" ADD CONSTRAINT "body_reports_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_reports" ADD CONSTRAINT "body_reports_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_students" ADD CONSTRAINT "coach_students_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_students" ADD CONSTRAINT "coach_students_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_media" ADD CONSTRAINT "exercise_media_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plan_days" ADD CONSTRAINT "workout_plan_days_workout_plan_id_workout_plans_id_fk" FOREIGN KEY ("workout_plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_workout_plan_day_id_workout_plan_days_id_fk" FOREIGN KEY ("workout_plan_day_id") REFERENCES "public"."workout_plan_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session_items" ADD CONSTRAINT "workout_session_items_workout_session_id_workout_sessions_id_fk" FOREIGN KEY ("workout_session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session_items" ADD CONSTRAINT "workout_session_items_workout_plan_exercise_id_workout_plan_exercises_id_fk" FOREIGN KEY ("workout_plan_exercise_id") REFERENCES "public"."workout_plan_exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_workout_plan_day_id_workout_plan_days_id_fk" FOREIGN KEY ("workout_plan_day_id") REFERENCES "public"."workout_plan_days"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "body_report_media_report_idx" ON "body_report_media" USING btree ("body_report_id");--> statement-breakpoint
CREATE INDEX "body_reports_student_date_idx" ON "body_reports" USING btree ("student_id","recorded_at");--> statement-breakpoint
CREATE INDEX "body_reports_coach_idx" ON "body_reports" USING btree ("coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_students_pair_unique" ON "coach_students" USING btree ("coach_id","student_id");--> statement-breakpoint
CREATE INDEX "coach_students_coach_idx" ON "coach_students" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_students_student_idx" ON "coach_students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "exercise_media_exercise_idx" ON "exercise_media" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "exercises_coach_idx" ON "exercises" USING btree ("coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workout_plan_days_plan_idx" ON "workout_plan_days" USING btree ("workout_plan_id");--> statement-breakpoint
CREATE INDEX "workout_plan_exercises_day_idx" ON "workout_plan_exercises" USING btree ("workout_plan_day_id");--> statement-breakpoint
CREATE INDEX "workout_plans_coach_idx" ON "workout_plans" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "workout_plans_student_idx" ON "workout_plans" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "workout_session_items_session_idx" ON "workout_session_items" USING btree ("workout_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_session_items_mutation_unique" ON "workout_session_items" USING btree ("client_mutation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_sessions_student_day_date_unique" ON "workout_sessions" USING btree ("student_id","workout_plan_day_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "workout_sessions_student_idx" ON "workout_sessions" USING btree ("student_id");