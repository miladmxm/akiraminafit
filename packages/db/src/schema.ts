import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['coach', 'student']);
export const relationStatusEnum = pgEnum('relation_status', ['pending', 'active', 'archived']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);
export const planStatusEnum = pgEnum('plan_status', ['draft', 'active', 'completed', 'archived']);
export const sessionStatusEnum = pgEnum('session_status', [
  'pending',
  'in_progress',
  'completed',
  'skipped',
]);
export const bodyViewEnum = pgEnum('body_view', ['front', 'side', 'back', 'other']);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  phone: text("phone"),
  timezone: text("timezone").default("Asia/Tehran").notNull(),
  locale: text("locale").default("fa-IR").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);


export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('accounts_user_idx').on(table.userId)],
);

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const coachStudents = pgTable(
  'coach_students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: relationStatusEnum('status').notNull().default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('coach_students_pair_unique').on(table.coachId, table.studentId),
    index('coach_students_coach_idx').on(table.coachId),
    index('coach_students_student_idx').on(table.studentId),
  ],
);

export const studentProfiles = pgTable('student_profiles', {
  studentId: text('student_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  goal: text('goal').notNull().default(''),
  birthDate: date('birth_date', { mode: 'date' }),
  gender: varchar('gender', { length: 16 }),
  heightCm: numeric('height_cm', { precision: 6, scale: 2 }),
  initialWeightKg: numeric('initial_weight_kg', { precision: 6, scale: 2 }),
  medicalNotes: text('medical_notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull().default(''),
    instructions: text('instructions').notNull().default(''),
    muscleGroup: varchar('muscle_group', { length: 80 }).notNull(),
    equipment: varchar('equipment', { length: 80 }).notNull().default('بدون وسیله'),
    difficulty: difficultyEnum('difficulty').notNull().default('beginner'),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('exercises_coach_idx').on(table.coachId)],
);

export const exerciseMedia = pgTable(
  'exercise_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    mediaType: mediaTypeEnum('media_type').notNull(),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: integer('file_size').notNull(),
    durationSeconds: integer('duration_seconds'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('exercise_media_exercise_idx').on(table.exerciseId)],
);

export const workoutPlans = pgTable(
  'workout_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull().default(''),
    startDate: date('start_date', { mode: 'date' }).notNull(),
    endDate: date('end_date', { mode: 'date' }),
    status: planStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workout_plans_coach_idx').on(table.coachId),
    index('workout_plans_student_idx').on(table.studentId),
  ],
);

export const workoutPlanDays = pgTable(
  'workout_plan_days',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutPlanId: uuid('workout_plan_id')
      .notNull()
      .references(() => workoutPlans.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    dayNumber: integer('day_number').notNull(),
    weekday: integer('weekday'),
    notes: text('notes').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('workout_plan_days_plan_idx').on(table.workoutPlanId)],
);

export const workoutPlanExercises = pgTable(
  'workout_plan_exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutPlanDayId: uuid('workout_plan_day_id')
      .notNull()
      .references(() => workoutPlanDays.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    exerciseTitleSnapshot: varchar('exercise_title_snapshot', { length: 120 }).notNull(),
    exerciseDescriptionSnapshot: text('exercise_description_snapshot').notNull().default(''),
    sets: integer('sets').notNull(),
    reps: varchar('reps', { length: 30 }).notNull(),
    durationSeconds: integer('duration_seconds'),
    restSeconds: integer('rest_seconds').notNull().default(60),
    targetWeight: numeric('target_weight', { precision: 7, scale: 2 }),
    targetRpe: numeric('target_rpe', { precision: 3, scale: 1 }),
    tempo: varchar('tempo', { length: 30 }),
    notes: text('notes').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('workout_plan_exercises_day_idx').on(table.workoutPlanDayId)],
);

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workoutPlanDayId: uuid('workout_plan_day_id')
      .notNull()
      .references(() => workoutPlanDays.id, { onDelete: 'restrict' }),
    scheduledDate: date('scheduled_date', { mode: 'date' }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: sessionStatusEnum('status').notNull().default('pending'),
    studentNote: text('student_note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('workout_sessions_student_day_date_unique').on(
      table.studentId,
      table.workoutPlanDayId,
      table.scheduledDate,
    ),
    index('workout_sessions_student_idx').on(table.studentId),
  ],
);

export const workoutSessionItems = pgTable(
  'workout_session_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutSessionId: uuid('workout_session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    workoutPlanExerciseId: uuid('workout_plan_exercise_id')
      .notNull()
      .references(() => workoutPlanExercises.id, { onDelete: 'restrict' }),
    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    actualSets: integer('actual_sets'),
    actualReps: varchar('actual_reps', { length: 30 }),
    actualWeight: numeric('actual_weight', { precision: 7, scale: 2 }),
    actualDurationSeconds: integer('actual_duration_seconds'),
    actualRpe: numeric('actual_rpe', { precision: 3, scale: 1 }),
    studentNote: text('student_note').notNull().default(''),
    clientMutationId: varchar('client_mutation_id', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('workout_session_items_session_idx').on(table.workoutSessionId),
    uniqueIndex('workout_session_items_mutation_unique').on(table.clientMutationId),
  ],
);

export const bodyReports = pgTable(
  'body_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
    heightCm: numeric('height_cm', { precision: 6, scale: 2 }),
    bodyFatPercent: numeric('body_fat_percent', { precision: 5, scale: 2 }),
    muscleMassKg: numeric('muscle_mass_kg', { precision: 6, scale: 2 }),
    neckCm: numeric('neck_cm', { precision: 6, scale: 2 }),
    chestCm: numeric('chest_cm', { precision: 6, scale: 2 }),
    waistCm: numeric('waist_cm', { precision: 6, scale: 2 }),
    hipCm: numeric('hip_cm', { precision: 6, scale: 2 }),
    armLeftCm: numeric('arm_left_cm', { precision: 6, scale: 2 }),
    armRightCm: numeric('arm_right_cm', { precision: 6, scale: 2 }),
    thighLeftCm: numeric('thigh_left_cm', { precision: 6, scale: 2 }),
    thighRightCm: numeric('thigh_right_cm', { precision: 6, scale: 2 }),
    restingHeartRate: integer('resting_heart_rate'),
    bloodPressureSystolic: integer('blood_pressure_systolic'),
    bloodPressureDiastolic: integer('blood_pressure_diastolic'),
    notes: text('notes').notNull().default(''),
    extraMetrics: jsonb('extra_metrics')
      .$type<Record<string, number | string>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('body_reports_student_date_idx').on(table.studentId, table.recordedAt),
    index('body_reports_coach_idx').on(table.coachId),
  ],
);

export const bodyReportMedia = pgTable(
  'body_report_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bodyReportId: uuid('body_report_id')
      .notNull()
      .references(() => bodyReports.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    viewType: bodyViewEnum('view_type').notNull().default('other'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('body_report_media_report_idx').on(table.bodyReportId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  coachLinks: many(coachStudents, { relationName: 'coach' }),
  studentLinks: many(coachStudents, { relationName: 'student' }),
  exercises: many(exercises),
  coachedPlans: many(workoutPlans, { relationName: 'coachPlans' }),
  assignedPlans: many(workoutPlans, { relationName: 'studentPlans' }),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));


export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  student: one(users, {
    fields: [studentProfiles.studentId],
    references: [users.id],
  }),
}));

export const coachStudentsRelations = relations(coachStudents, ({ one }) => ({
  coach: one(users, {
    fields: [coachStudents.coachId],
    references: [users.id],
    relationName: 'coach',
  }),
  student: one(users, {
    fields: [coachStudents.studentId],
    references: [users.id],
    relationName: 'student',
  }),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  coach: one(users, { fields: [exercises.coachId], references: [users.id] }),
  media: many(exerciseMedia),
  planItems: many(workoutPlanExercises),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  coach: one(users, {
    fields: [workoutPlans.coachId],
    references: [users.id],
    relationName: 'coachPlans',
  }),
  student: one(users, {
    fields: [workoutPlans.studentId],
    references: [users.id],
    relationName: 'studentPlans',
  }),
  days: many(workoutPlanDays),
}));

export const workoutPlanDaysRelations = relations(workoutPlanDays, ({ one, many }) => ({
  plan: one(workoutPlans, {
    fields: [workoutPlanDays.workoutPlanId],
    references: [workoutPlans.id],
  }),
  exercises: many(workoutPlanExercises),
  sessions: many(workoutSessions),
}));

export const workoutPlanExercisesRelations = relations(workoutPlanExercises, ({ one, many }) => ({
  day: one(workoutPlanDays, {
    fields: [workoutPlanExercises.workoutPlanDayId],
    references: [workoutPlanDays.id],
  }),
  exercise: one(exercises, {
    fields: [workoutPlanExercises.exerciseId],
    references: [exercises.id],
  }),
  sessionItems: many(workoutSessionItems),
}));
