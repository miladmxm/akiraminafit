import { workoutPlanInputSchema } from '@akiraminafit/contracts';
import {
  db,
  exercises,
  workoutPlanDays,
  workoutPlanExercises,
  workoutPlans,
} from '@akiraminafit/db';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { coachCanAccessStudent } from '../lib/access.js';
import { requirePermission } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

export const plansRoutes = new Hono<AppEnv>()
  .get('/student/:studentId', requirePermission({ plans: ['view'] }), async (c) => {
    const coach = c.get('user');
    const studentId = c.req.param('studentId');
    if (!(await coachCanAccessStudent(coach.id, studentId))) {
      return c.json({ message: 'شاگرد در فهرست شما نیست.' }, 403);
    }
    const plans = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.coachId, coach.id), eq(workoutPlans.studentId, studentId)))
      .orderBy(asc(workoutPlans.startDate));
    return c.json({ data: plans });
  })
  .get('/:id', requirePermission({ plans: ['view'] }), async (c) => {
    const coach = c.get('user');
    const [plan] = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.id, c.req.param('id')), eq(workoutPlans.coachId, coach.id)))
      .limit(1);
    if (!plan) return c.json({ message: 'برنامه پیدا نشد.' }, 404);

    const days = await db
      .select()
      .from(workoutPlanDays)
      .where(eq(workoutPlanDays.workoutPlanId, plan.id))
      .orderBy(asc(workoutPlanDays.sortOrder));
    const dayIds = days.map((day) => day.id);
    const items = dayIds.length
      ? await db
          .select()
          .from(workoutPlanExercises)
          .where(inArray(workoutPlanExercises.workoutPlanDayId, dayIds))
          .orderBy(asc(workoutPlanExercises.sortOrder))
      : [];

    return c.json({
      data: {
        ...plan,
        days: days.map((day) => ({
          ...day,
          exercises: items.filter((item) => item.workoutPlanDayId === day.id),
        })),
      },
    });
  })
  .post(
    '/',
    requirePermission({ plans: ['create'] }),
    zValidator('json', workoutPlanInputSchema),
    async (c) => {
      const coach = c.get('user');
      const input = c.req.valid('json');
      if (!(await coachCanAccessStudent(coach.id, input.studentId))) {
        return c.json({ message: 'شاگرد در فهرست شما نیست.' }, 403);
      }

      const exerciseIds = [
        ...new Set(input.days.flatMap((day) => day.exercises.map((item) => item.exerciseId))),
      ];
      const library = await db
        .select()
        .from(exercises)
        .where(and(eq(exercises.coachId, coach.id), inArray(exercises.id, exerciseIds)));
      if (library.length !== exerciseIds.length) {
        return c.json({ message: 'حداقل یکی از حرکات انتخاب‌شده معتبر نیست.' }, 400);
      }
      const exerciseMap = new Map(library.map((exercise) => [exercise.id, exercise]));

      const created = await db.transaction(async (tx) => {
        const [plan] = await tx
          .insert(workoutPlans)
          .values({
            coachId: coach.id,
            studentId: input.studentId,
            title: input.title,
            description: input.description,
            startDate: input.startDate,
            endDate: null,
            status: 'draft',
          })
          .returning();
        if (!plan) throw new Error('Plan creation failed');

        for (const [dayIndex, day] of input.days.entries()) {
          const [createdDay] = await tx
            .insert(workoutPlanDays)
            .values({
              workoutPlanId: plan.id,
              title: day.title,
              dayNumber: day.dayNumber,
              weekday: day.weekday,
              notes: day.notes,
              sortOrder: dayIndex,
            })
            .returning();
          if (!createdDay) throw new Error('Day creation failed');

          await tx.insert(workoutPlanExercises).values(
            day.exercises.map((item, itemIndex) => {
              const exercise = exerciseMap.get(item.exerciseId);
              if (!exercise) throw new Error('Exercise not found');
              return {
                workoutPlanDayId: createdDay.id,
                exerciseId: exercise.id,
                exerciseTitleSnapshot: exercise.title,
                exerciseDescriptionSnapshot: exercise.description,
                sets: item.sets,
                reps: item.reps,
                restSeconds: item.restSeconds,
                targetWeight: item.targetWeight?.toString() ?? null,
                targetRpe: item.targetRpe?.toString() ?? null,
                tempo: item.tempo,
                notes: item.notes,
                sortOrder: itemIndex,
              };
            }),
          );
        }
        return plan;
      });

      return c.json({ data: created }, 201);
    },
  )
  .post('/:id/publish', requirePermission({ plans: ['publish'] }), async (c) => {
    const coach = c.get('user');
    const [ownedPlan] = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.id, c.req.param('id')), eq(workoutPlans.coachId, coach.id)))
      .limit(1);
    if (!ownedPlan) return c.json({ message: 'برنامه پیدا نشد.' }, 404);

    const updated = await db.transaction(async (tx) => {
      await tx
        .update(workoutPlans)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(
          and(
            eq(workoutPlans.studentId, ownedPlan.studentId),
            eq(workoutPlans.status, 'active'),
            eq(workoutPlans.startDate, ownedPlan.startDate),
            ne(workoutPlans.id, ownedPlan.id),
          ),
        );

      const [published] = await tx
        .update(workoutPlans)
        .set({ status: 'active', endDate: null, updatedAt: new Date() })
        .where(eq(workoutPlans.id, ownedPlan.id))
        .returning();
      if (!published) throw new Error('Plan publish failed');

      const timeline = await tx
        .select({ id: workoutPlans.id, startDate: workoutPlans.startDate })
        .from(workoutPlans)
        .where(
          and(eq(workoutPlans.studentId, ownedPlan.studentId), eq(workoutPlans.status, 'active')),
        )
        .orderBy(asc(workoutPlans.startDate));

      for (const [index, plan] of timeline.entries()) {
        const next = timeline[index + 1];
        const endDate = next ? new Date(next.startDate) : null;
        if (endDate) endDate.setUTCDate(endDate.getUTCDate() - 1);
        await tx
          .update(workoutPlans)
          .set({ endDate, updatedAt: new Date() })
          .where(eq(workoutPlans.id, plan.id));
      }
      return published;
    });

    return c.json({ data: updated });
  });
