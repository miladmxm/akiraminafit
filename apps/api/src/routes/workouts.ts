import { sessionItemUpdateSchema } from '@akiraminafit/contracts';
import {
  db,
  exerciseMedia,
  workoutPlanDays,
  workoutPlanExercises,
  workoutPlans,
  workoutSessionItems,
  workoutSessions,
} from '@akiraminafit/db';
import { and, asc, desc, eq, inArray, lte, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requirePermission } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

function tehranToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

export const workoutsRoutes = new Hono<AppEnv>()
  .get('/today', requirePermission({ workouts: ['view'] }), async (c) => {
    const student = c.get('user');
    const today = tehranToday();
    const weekday = today.getUTCDay();

    const [plan] = await db
      .select()
      .from(workoutPlans)
      .where(
        and(
          eq(workoutPlans.studentId, student.id),
          eq(workoutPlans.status, 'active'),
          lte(workoutPlans.startDate, today),
          or(sql`${workoutPlans.endDate} is null`, sql`${workoutPlans.endDate} >= ${today}`),
        ),
      )
      .orderBy(desc(workoutPlans.startDate))
      .limit(1);

    if (!plan) return c.json({ data: null, message: 'برای امروز برنامه فعالی وجود ندارد.' });

    const [day] = await db
      .select()
      .from(workoutPlanDays)
      .where(and(eq(workoutPlanDays.workoutPlanId, plan.id), eq(workoutPlanDays.weekday, weekday)))
      .orderBy(asc(workoutPlanDays.sortOrder))
      .limit(1);

    if (!day) return c.json({ data: null, message: 'امروز روز استراحت است.' });

    const plannedItems = await db
      .select()
      .from(workoutPlanExercises)
      .where(eq(workoutPlanExercises.workoutPlanDayId, day.id))
      .orderBy(asc(workoutPlanExercises.sortOrder));

    let [session] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.studentId, student.id),
          eq(workoutSessions.workoutPlanDayId, day.id),
          eq(workoutSessions.scheduledDate, today),
        ),
      )
      .limit(1);

    if (!session) {
      [session] = await db
        .insert(workoutSessions)
        .values({
          studentId: student.id,
          workoutPlanDayId: day.id,
          scheduledDate: today,
          status: 'pending',
        })
        .returning();
      if (!session) throw new Error('Session creation failed');
      if (plannedItems.length) {
        const workoutSessionId = session.id;
        await db.insert(workoutSessionItems).values(
          plannedItems.map((item) => ({
            workoutSessionId,
            workoutPlanExerciseId: item.id,
            sortOrder: item.sortOrder,
          })),
        );
      }
    }

    const sessionItems = await db
      .select()
      .from(workoutSessionItems)
      .where(eq(workoutSessionItems.workoutSessionId, session.id))
      .orderBy(asc(workoutSessionItems.sortOrder));

    const media = plannedItems.length
      ? await db
          .select()
          .from(exerciseMedia)
          .where(
            inArray(
              exerciseMedia.exerciseId,
              plannedItems.map((item) => item.exerciseId),
            ),
          )
          .orderBy(asc(exerciseMedia.sortOrder))
      : [];

    return c.json({
      data: {
        plan,
        day,
        session,
        items: sessionItems.map((sessionItem) => {
          const planned = plannedItems.find(
            (item) => item.id === sessionItem.workoutPlanExerciseId,
          );
          return {
            ...sessionItem,
            planned,
            media: planned ? media.filter((item) => item.exerciseId === planned.exerciseId) : [],
          };
        }),
      },
    });
  })
  .patch(
    '/sessions/:sessionId',
    requirePermission({ workouts: ['update'] }),
    zValidator('json', z.object({ studentNote: z.string().trim().max(1000) })),
    async (c) => {
      const student = c.get('user');
      const [updated] = await db
        .update(workoutSessions)
        .set({ studentNote: c.req.valid('json').studentNote })
        .where(
          and(
            eq(workoutSessions.id, c.req.param('sessionId')),
            eq(workoutSessions.studentId, student.id),
          ),
        )
        .returning();
      if (!updated) return c.json({ message: 'جلسه تمرینی پیدا نشد.' }, 404);
      return c.json({ data: updated });
    },
  )
  .patch(
    '/sessions/:sessionId/items/:itemId',
    requirePermission({ workouts: ['update'] }),
    zValidator('json', sessionItemUpdateSchema),
    async (c) => {
      const student = c.get('user');
      const input = c.req.valid('json');
      const [owned] = await db
        .select({ id: workoutSessionItems.id })
        .from(workoutSessionItems)
        .innerJoin(workoutSessions, eq(workoutSessionItems.workoutSessionId, workoutSessions.id))
        .where(
          and(
            eq(workoutSessionItems.id, c.req.param('itemId')),
            eq(workoutSessions.id, c.req.param('sessionId')),
            eq(workoutSessions.studentId, student.id),
          ),
        )
        .limit(1);
      if (!owned) return c.json({ message: 'آیتم تمرین پیدا نشد.' }, 404);

      const [updated] = await db
        .update(workoutSessionItems)
        .set({
          isCompleted: input.isCompleted,
          completedAt: input.isCompleted ? new Date() : null,
          actualSets: input.actualSets,
          actualReps: input.actualReps,
          actualWeight:
            input.actualWeight == null ? input.actualWeight : input.actualWeight.toString(),
          actualDurationSeconds: input.actualDurationSeconds,
          actualRpe: input.actualRpe == null ? input.actualRpe : input.actualRpe.toString(),
          studentNote: input.studentNote ?? '',
          clientMutationId: input.clientMutationId,
        })
        .where(eq(workoutSessionItems.id, owned.id))
        .returning();

      const [progressRow] = await db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${workoutSessionItems.isCompleted})::int`,
        })
        .from(workoutSessionItems)
        .where(eq(workoutSessionItems.workoutSessionId, c.req.param('sessionId')));
      const total = progressRow?.total ?? 0;
      const completed = progressRow?.completed ?? 0;

      await db
        .update(workoutSessions)
        .set({
          status: completed === total && total > 0 ? 'completed' : 'in_progress',
          startedAt: sql`coalesce(${workoutSessions.startedAt}, now())`,
          completedAt: completed === total && total > 0 ? new Date() : null,
        })
        .where(eq(workoutSessions.id, c.req.param('sessionId')));

      return c.json({ data: updated, progress: { total, completed } });
    },
  );
