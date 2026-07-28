import { bodyReportInputSchema } from '@fitflow/contracts';
import { bodyReports, db } from '@fitflow/db';
import { and, asc, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { coachCanAccessStudent } from '../lib/access.js';
import type { AppEnv } from '../types.js';

export const coachReportsRoutes = new Hono<AppEnv>()
  .get('/:studentId', async (c) => {
    const coach = c.get('user');
    const studentId = c.req.param('studentId');
    if (!(await coachCanAccessStudent(coach.id, studentId))) {
      return c.json({ message: 'شاگرد در فهرست شما نیست.' }, 403);
    }
    const rows = await db
      .select()
      .from(bodyReports)
      .where(and(eq(bodyReports.coachId, coach.id), eq(bodyReports.studentId, studentId)))
      .orderBy(desc(bodyReports.recordedAt));
    return c.json({ data: rows });
  })
  .post('/', zValidator('json', bodyReportInputSchema), async (c) => {
    const coach = c.get('user');
    const input = c.req.valid('json');
    if (!(await coachCanAccessStudent(coach.id, input.studentId))) {
      return c.json({ message: 'شاگرد در فهرست شما نیست.' }, 403);
    }
    const [created] = await db
      .insert(bodyReports)
      .values({
        coachId: coach.id,
        ...input,
        weightKg: input.weightKg?.toString() ?? null,
        heightCm: input.heightCm?.toString() ?? null,
        bodyFatPercent: input.bodyFatPercent?.toString() ?? null,
        muscleMassKg: input.muscleMassKg?.toString() ?? null,
        waistCm: input.waistCm?.toString() ?? null,
        chestCm: input.chestCm?.toString() ?? null,
        armRightCm: input.armRightCm?.toString() ?? null,
        thighRightCm: input.thighRightCm?.toString() ?? null,
      })
      .returning();
    return c.json({ data: created }, 201);
  });

export const studentReportsRoutes = new Hono<AppEnv>().get('/', async (c) => {
  const student = c.get('user');
  const rows = await db
    .select()
    .from(bodyReports)
    .where(eq(bodyReports.studentId, student.id))
    .orderBy(asc(bodyReports.recordedAt));
  return c.json({ data: rows });
});
