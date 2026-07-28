CREATE TABLE "student_profiles" (
	"student_id" text PRIMARY KEY NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"birth_date" date,
	"gender" varchar(16),
	"height_cm" numeric(6, 2),
	"initial_weight_kg" numeric(6, 2),
	"medical_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;