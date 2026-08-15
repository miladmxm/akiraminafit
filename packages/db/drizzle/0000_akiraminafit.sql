DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('coach', 'student'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."relation_status" AS ENUM('pending', 'active', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."media_type" AS ENUM('image', 'video'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."plan_status" AS ENUM('draft', 'active', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."session_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."body_view" AS ENUM('front', 'side', 'back', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "role" "user_role" DEFAULT 'student' NOT NULL,
  "phone" varchar(32),
  "timezone" varchar(64) DEFAULT 'Asia/Tehran' NOT NULL,
  "locale" varchar(16) DEFAULT 'fa-IR' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_unique" ON "sessions" ("token");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "accounts" ("user_id");

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coach_students" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "student_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "relation_status" DEFAULT 'active' NOT NULL,
  "started_at" timestamptz DEFAULT now() NOT NULL,
  "ended_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "coach_students_pair_unique" ON "coach_students" ("coach_id", "student_id");
CREATE INDEX IF NOT EXISTS "coach_students_coach_idx" ON "coach_students" ("coach_id");
CREATE INDEX IF NOT EXISTS "coach_students_student_idx" ON "coach_students" ("student_id");

CREATE TABLE IF NOT EXISTS "exercises" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(120) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "instructions" text DEFAULT '' NOT NULL,
  "muscle_group" varchar(80) NOT NULL,
  "equipment" varchar(80) DEFAULT 'بدون وسیله' NOT NULL,
  "difficulty" "difficulty" DEFAULT 'beginner' NOT NULL,
  "is_archived" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "exercises_coach_idx" ON "exercises" ("coach_id");

CREATE TABLE IF NOT EXISTS "exercise_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "media_type" "media_type" NOT NULL,
  "storage_key" text NOT NULL,
  "url" text NOT NULL,
  "thumbnail_url" text,
  "mime_type" varchar(100) NOT NULL,
  "file_size" integer NOT NULL,
  "duration_seconds" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "exercise_media_exercise_idx" ON "exercise_media" ("exercise_id");

CREATE TABLE IF NOT EXISTS "workout_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "student_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(120) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date,
  "status" "plan_status" DEFAULT 'draft' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "workout_plans_coach_idx" ON "workout_plans" ("coach_id");
CREATE INDEX IF NOT EXISTS "workout_plans_student_idx" ON "workout_plans" ("student_id");

CREATE TABLE IF NOT EXISTS "workout_plan_days" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workout_plan_id" uuid NOT NULL REFERENCES "workout_plans"("id") ON DELETE CASCADE,
  "title" varchar(120) NOT NULL,
  "day_number" integer NOT NULL,
  "weekday" integer,
  "notes" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
CREATE INDEX IF NOT EXISTS "workout_plan_days_plan_idx" ON "workout_plan_days" ("workout_plan_id");

CREATE TABLE IF NOT EXISTS "workout_plan_exercises" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workout_plan_day_id" uuid NOT NULL REFERENCES "workout_plan_days"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE RESTRICT,
  "exercise_title_snapshot" varchar(120) NOT NULL,
  "exercise_description_snapshot" text DEFAULT '' NOT NULL,
  "sets" integer NOT NULL,
  "reps" varchar(30) NOT NULL,
  "duration_seconds" integer,
  "rest_seconds" integer DEFAULT 60 NOT NULL,
  "target_weight" numeric(7,2),
  "target_rpe" numeric(3,1),
  "tempo" varchar(30),
  "notes" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
CREATE INDEX IF NOT EXISTS "workout_plan_exercises_day_idx" ON "workout_plan_exercises" ("workout_plan_day_id");

CREATE TABLE IF NOT EXISTS "workout_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workout_plan_day_id" uuid NOT NULL REFERENCES "workout_plan_days"("id") ON DELETE RESTRICT,
  "scheduled_date" date NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "status" "session_status" DEFAULT 'pending' NOT NULL,
  "student_note" text DEFAULT '' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "workout_sessions_student_day_date_unique" ON "workout_sessions" ("student_id", "workout_plan_day_id", "scheduled_date");
CREATE INDEX IF NOT EXISTS "workout_sessions_student_idx" ON "workout_sessions" ("student_id");

CREATE TABLE IF NOT EXISTS "workout_session_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workout_session_id" uuid NOT NULL REFERENCES "workout_sessions"("id") ON DELETE CASCADE,
  "workout_plan_exercise_id" uuid NOT NULL REFERENCES "workout_plan_exercises"("id") ON DELETE RESTRICT,
  "is_completed" boolean DEFAULT false NOT NULL,
  "completed_at" timestamptz,
  "actual_sets" integer,
  "actual_reps" varchar(30),
  "actual_weight" numeric(7,2),
  "actual_duration_seconds" integer,
  "actual_rpe" numeric(3,1),
  "student_note" text DEFAULT '' NOT NULL,
  "client_mutation_id" varchar(100),
  "sort_order" integer DEFAULT 0 NOT NULL
);
CREATE INDEX IF NOT EXISTS "workout_session_items_session_idx" ON "workout_session_items" ("workout_session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "workout_session_items_mutation_unique" ON "workout_session_items" ("client_mutation_id");

CREATE TABLE IF NOT EXISTS "body_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "student_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recorded_at" timestamptz NOT NULL,
  "weight_kg" numeric(6,2),
  "height_cm" numeric(6,2),
  "body_fat_percent" numeric(5,2),
  "muscle_mass_kg" numeric(6,2),
  "neck_cm" numeric(6,2),
  "chest_cm" numeric(6,2),
  "waist_cm" numeric(6,2),
  "hip_cm" numeric(6,2),
  "arm_left_cm" numeric(6,2),
  "arm_right_cm" numeric(6,2),
  "thigh_left_cm" numeric(6,2),
  "thigh_right_cm" numeric(6,2),
  "resting_heart_rate" integer,
  "blood_pressure_systolic" integer,
  "blood_pressure_diastolic" integer,
  "notes" text DEFAULT '' NOT NULL,
  "extra_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "body_reports_student_date_idx" ON "body_reports" ("student_id", "recorded_at");
CREATE INDEX IF NOT EXISTS "body_reports_coach_idx" ON "body_reports" ("coach_id");

CREATE TABLE IF NOT EXISTS "body_report_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "body_report_id" uuid NOT NULL REFERENCES "body_reports"("id") ON DELETE CASCADE,
  "storage_key" text NOT NULL,
  "url" text NOT NULL,
  "view_type" "body_view" DEFAULT 'other' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "body_report_media_report_idx" ON "body_report_media" ("body_report_id");
