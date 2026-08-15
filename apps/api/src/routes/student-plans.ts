import { db, workoutPlanDays, workoutPlanExercises, workoutPlans } from '@akiraminafit/db';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { Hono } from 'hono';
import { requirePermission } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

export const studentPlansRoutes = new Hono<AppEnv>().get(
  '/',
  requirePermission({ plans: ['view'] }),
  async (c) => {
    const student = c.get('user');
    const plans = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.studentId, student.id), ne(workoutPlans.status, 'draft')))
      .orderBy(desc(workoutPlans.startDate));

    if (!plans.length) return c.json({ data: [] });

    const planIds = plans.map((plan) => plan.id);
    const days = await db
      .select()
      .from(workoutPlanDays)
      .where(inArray(workoutPlanDays.workoutPlanId, planIds))
      .orderBy(workoutPlanDays.sortOrder);
    const dayIds = days.map((day) => day.id);
    const items = dayIds.length
      ? await db
          .select()
          .from(workoutPlanExercises)
          .where(inArray(workoutPlanExercises.workoutPlanDayId, dayIds))
          .orderBy(workoutPlanExercises.sortOrder)
      : [];

    return c.json({
      data: plans.map((plan) => ({
        ...plan,
        days: days
          .filter((day) => day.workoutPlanId === plan.id)
          .map((day) => ({
            ...day,
            exercises: items.filter((item) => item.workoutPlanDayId === day.id),
          })),
      })),
    });
  },
);
