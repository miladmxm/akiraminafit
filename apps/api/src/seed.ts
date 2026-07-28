import {
  bodyReports,
  coachStudents,
  db,
  exercises,
  users,
  workoutPlanDays,
  workoutPlanExercises,
  workoutPlans,
} from '@fitflow/db';
import { eq } from 'drizzle-orm';
import { auth } from './auth.js';

async function ensureUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'coach' | 'student';
}) {
  let [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (!existing) {
    await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });
    [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  }
  if (!existing) throw new Error(`Could not create ${input.email}`);
  const [updated] = await db
    .update(users)
    .set({ role: input.role, emailVerified: true })
    .where(eq(users.id, existing.id))
    .returning();
  if (!updated) throw new Error(`Could not update ${input.email}`);
  return updated;
}

async function main() {
  const coach = await ensureUser({
    name: 'آرش رضایی',
    email: 'coach@example.com',
    password: 'Coach123!',
    role: 'coach',
  });
  const student = await ensureUser({
    name: 'نیما احمدی',
    email: 'student@example.com',
    password: 'Student123!',
    role: 'student',
  });

  await db
    .insert(coachStudents)
    .values({ coachId: coach.id, studentId: student.id, status: 'active' })
    .onConflictDoNothing();

  const existingExercises = await db
    .select()
    .from(exercises)
    .where(eq(exercises.coachId, coach.id));
  const exerciseRows = existingExercises.length
    ? existingExercises
    : await db
        .insert(exercises)
        .values([
          {
            coachId: coach.id,
            title: 'پرس سینه دمبل',
            description: 'حرکت اصلی برای تقویت عضلات سینه و پشت بازو.',
            instructions: 'کتف‌ها را روی نیمکت ثابت نگه دارید و دمبل‌ها را کنترل‌شده پایین بیاورید.',
            muscleGroup: 'سینه',
            equipment: 'دمبل و نیمکت',
            difficulty: 'intermediate',
          },
          {
            coachId: coach.id,
            title: 'اسکوات جام',
            description: 'حرکت چندمفصلی برای پا و عضلات مرکزی.',
            instructions: 'زانوها هم‌جهت پنجه‌ها حرکت کنند و ستون فقرات خنثی بماند.',
            muscleGroup: 'پا',
            equipment: 'دمبل',
            difficulty: 'beginner',
          },
          {
            coachId: coach.id,
            title: 'قایقی سیم‌کش',
            description: 'تمرکز روی عضلات پشت و جمع‌کردن کتف‌ها.',
            instructions: 'بدون تاب‌دادن تنه، دستگیره را به سمت پایین سینه بکشید.',
            muscleGroup: 'پشت',
            equipment: 'دستگاه سیم‌کش',
            difficulty: 'beginner',
          },
        ])
        .returning();

  const [existingPlan] = await db
    .select()
    .from(workoutPlans)
    .where(eq(workoutPlans.studentId, student.id))
    .limit(1);

  if (!existingPlan) {
    const [plan] = await db
      .insert(workoutPlans)
      .values({
        coachId: coach.id,
        studentId: student.id,
        title: 'دوره افزایش قدرت - هفته اول',
        description: 'سه جلسه تمرین تمام‌بدن با تمرکز روی تکنیک صحیح.',
        startDate: new Date(),
        status: 'active',
      })
      .returning();
    if (!plan) throw new Error('Plan seed failed');

    const [day] = await db
      .insert(workoutPlanDays)
      .values({
        workoutPlanId: plan.id,
        title: 'تمرین تمام بدن A',
        dayNumber: 1,
        weekday: new Date().getDay(),
        sortOrder: 0,
      })
      .returning();
    if (!day) throw new Error('Day seed failed');

    await db.insert(workoutPlanExercises).values(
      exerciseRows.slice(0, 3).map((exercise, index) => ({
        workoutPlanDayId: day.id,
        exerciseId: exercise.id,
        exerciseTitleSnapshot: exercise.title,
        exerciseDescriptionSnapshot: exercise.description,
        sets: index === 0 ? 4 : 3,
        reps: index === 0 ? '8-10' : '12',
        restSeconds: index === 0 ? 90 : 60,
        targetWeight: index === 0 ? '16' : '12',
        notes: 'فرم صحیح از وزن سنگین مهم‌تر است.',
        sortOrder: index,
      })),
    );
  }

  const existingReports = await db
    .select({ id: bodyReports.id })
    .from(bodyReports)
    .where(eq(bodyReports.studentId, student.id));
  if (!existingReports.length) {
    const now = new Date();
    await db.insert(bodyReports).values(
      [0, 1, 2, 3, 4].map((month) => ({
        coachId: coach.id,
        studentId: student.id,
        recordedAt: new Date(now.getFullYear(), now.getMonth() - (4 - month), 5),
        weightKg: String(84 - month * 1.2),
        bodyFatPercent: String(23 - month * 0.8),
        muscleMassKg: String(58 + month * 0.35),
        waistCm: String(96 - month * 1.3),
        notes: 'ثبت دوره‌ای وضعیت جسمانی',
      })),
    );
  }

  console.log('Seed completed.');
  console.log('Coach: coach@example.com / Coach123!');
  console.log('Student: student@example.com / Student123!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
