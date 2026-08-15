import { z } from 'zod';

export * from './auth-permissions.js';

export const roleSchema = z.enum(['coach', 'student']);
export type UserRole = z.infer<typeof roleSchema>;

export const idSchema = z.string().uuid();
export const userIdSchema = z.string().trim().min(8).max(128);

export const studentCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(32),
  password: z.string().min(8).max(128),
  goal: z.string().trim().min(2).max(1000),
  birthDate: z.coerce.date().nullable().default(null),
  gender: z.enum(['male', 'female', 'other']).nullable().default(null),
  heightCm: z.number().positive().max(300).nullable().default(null),
  initialWeightKg: z.number().positive().max(500).nullable().default(null),
  medicalNotes: z.string().trim().max(2000).default(''),
});
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const exerciseInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(''),
  instructions: z.string().trim().max(4000).default(''),
  muscleGroup: z.string().trim().min(2).max(80),
  equipment: z.string().trim().max(80).default('بدون وسیله'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

export const workoutExerciseInputSchema = z.object({
  exerciseId: idSchema,
  sets: z.number().int().positive().max(20),
  reps: z.string().trim().min(1).max(30),
  restSeconds: z.number().int().nonnegative().max(3600).default(60),
  targetWeight: z.number().nonnegative().nullable().default(null),
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  tempo: z.string().trim().max(30).nullable().default(null),
  notes: z.string().trim().max(500).default(''),
});

export const workoutPlanInputSchema = z
  .object({
    studentId: userIdSchema,
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1500).default(''),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().default(null),
    days: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(120),
          dayNumber: z.number().int().positive().max(31),
          weekday: z.number().int().min(0).max(6),
          notes: z.string().trim().max(500).default(''),
          exercises: z.array(workoutExerciseInputSchema).min(1),
        }),
      )
      .min(1),
  })
  .superRefine((plan, context) => {
    const weekdays = plan.days.map((day) => day.weekday);
    if (new Set(weekdays).size !== weekdays.length) {
      context.addIssue({
        code: 'custom',
        path: ['days'],
        message: 'هر روز هفته فقط می‌تواند یک جلسه تمرینی داشته باشد.',
      });
    }
  });
export type WorkoutPlanInput = z.infer<typeof workoutPlanInputSchema>;

export const bodyReportInputSchema = z.object({
  studentId: userIdSchema,
  recordedAt: z.coerce.date(),
  weightKg: z.number().positive().max(500).nullable().default(null),
  heightCm: z.number().positive().max(300).nullable().default(null),
  bodyFatPercent: z.number().min(0).max(100).nullable().default(null),
  muscleMassKg: z.number().nonnegative().max(300).nullable().default(null),
  waistCm: z.number().positive().max(400).nullable().default(null),
  chestCm: z.number().positive().max(400).nullable().default(null),
  armRightCm: z.number().positive().max(200).nullable().default(null),
  thighRightCm: z.number().positive().max(250).nullable().default(null),
  notes: z.string().trim().max(2000).default(''),
});
export type BodyReportInput = z.infer<typeof bodyReportInputSchema>;

export const sessionItemUpdateSchema = z.object({
  isCompleted: z.boolean(),
  actualSets: z.number().int().nonnegative().max(30).nullable().optional(),
  actualReps: z.string().trim().max(30).nullable().optional(),
  actualWeight: z.number().nonnegative().max(1000).nullable().optional(),
  actualDurationSeconds: z.number().int().nonnegative().max(86400).nullable().optional(),
  actualRpe: z.number().min(1).max(10).nullable().optional(),
  studentNote: z.string().trim().max(500).optional(),
  clientMutationId: z.string().min(8).max(100),
});
export type SessionItemUpdate = z.infer<typeof sessionItemUpdateSchema>;

export const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  size: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024),
  entityType: z.enum(['exercise', 'body-report']),
  entityId: idSchema,
});
