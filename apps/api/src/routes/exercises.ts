import { exerciseInputSchema } from '@akiraminafit/contracts';
import { db, exerciseMedia, exercises } from '@akiraminafit/db';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requirePermission } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

export const exercisesRoutes = new Hono<AppEnv>()
  .get('/', requirePermission({ exercises: ['list'] }), async (c) => {
    const coach = c.get('user');
    const rows = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.coachId, coach.id), eq(exercises.isArchived, false)))
      .orderBy(desc(exercises.createdAt));

    const media = rows.length
      ? await db
          .select()
          .from(exerciseMedia)
          .where(
            inArray(
              exerciseMedia.exerciseId,
              rows.map((row) => row.id),
            ),
          )
          .orderBy(asc(exerciseMedia.sortOrder))
      : [];

    return c.json({
      data: rows.map((exercise) => ({
        ...exercise,
        media: media.filter((item) => item.exerciseId === exercise.id),
      })),
    });
  })
  .post(
    '/',
    requirePermission({ exercises: ['create'] }),
    zValidator('json', exerciseInputSchema),
    async (c) => {
      const coach = c.get('user');
      const input = c.req.valid('json');
      const [created] = await db
        .insert(exercises)
        .values({ coachId: coach.id, ...input })
        .returning();
      return c.json({ data: created }, 201);
    },
  )
  .patch(
    '/:id',
    requirePermission({ exercises: ['update'] }),
    zValidator('json', exerciseInputSchema.partial()),
    async (c) => {
      const coach = c.get('user');
      const [updated] = await db
        .update(exercises)
        .set({ ...c.req.valid('json'), updatedAt: new Date() })
        .where(and(eq(exercises.id, c.req.param('id')), eq(exercises.coachId, coach.id)))
        .returning();

      if (!updated) return c.json({ message: 'حرکت پیدا نشد.' }, 404);
      return c.json({ data: updated });
    },
  )
  .delete('/:id', requirePermission({ exercises: ['delete'] }), async (c) => {
    const coach = c.get('user');
    const [archived] = await db
      .update(exercises)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(exercises.id, c.req.param('id')), eq(exercises.coachId, coach.id)))
      .returning({ id: exercises.id });

    if (!archived) return c.json({ message: 'حرکت پیدا نشد.' }, 404);
    return c.body(null, 204);
  });
