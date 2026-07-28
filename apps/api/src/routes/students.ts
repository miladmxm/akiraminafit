import { studentCreateSchema } from '@fitflow/contracts';
import { coachStudents, db, studentProfiles, users } from '@fitflow/db';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { auth } from '../auth.js';
import type { AppEnv } from '../types.js';

export const studentsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const coach = c.get('user');
    const rows = await db
      .select({
        linkId: coachStudents.id,
        status: coachStudents.status,
        startedAt: coachStudents.startedAt,
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        image: users.image,
        goal: studentProfiles.goal,
        birthDate: studentProfiles.birthDate,
        gender: studentProfiles.gender,
        heightCm: studentProfiles.heightCm,
        initialWeightKg: studentProfiles.initialWeightKg,
        medicalNotes: studentProfiles.medicalNotes,
      })
      .from(coachStudents)
      .innerJoin(users, eq(coachStudents.studentId, users.id))
      .leftJoin(studentProfiles, eq(studentProfiles.studentId, users.id))
      .where(and(eq(coachStudents.coachId, coach.id), eq(coachStudents.status, 'active')))
      .orderBy(desc(coachStudents.createdAt));

    return c.json({ data: rows });
  })
  .post('/', zValidator('json', studentCreateSchema), async (c) => {
    const coach = c.get('user');
    const input = c.req.valid('json');
    const authContext = await auth.$context;
    const existing = await authContext.internalAdapter.findUserByEmail(input.email);
    if (existing) {
      return c.json(
        { message: 'حسابی با این ایمیل از قبل وجود دارد؛ از گزینه دعوت استفاده کن.' },
        409,
      );
    }

    const password = await authContext.password.hash(input.password);
    const student = await authContext.internalAdapter.createUser({
      name: input.name,
      email: input.email,
      emailVerified: false,
      role: 'student',
      phone: input.phone,
      timezone: 'Asia/Tehran',
      locale: 'fa-IR',
      isActive: true,
    });

    try {
      await authContext.internalAdapter.linkAccount({
        accountId: student.id,
        providerId: 'credential',
        userId: student.id,
        password,
      });
      await db.transaction(async (tx) => {
        await tx.insert(studentProfiles).values({
          studentId: student.id,
          goal: input.goal,
          birthDate: input.birthDate,
          gender: input.gender,
          heightCm: input.heightCm?.toString() ?? null,
          initialWeightKg: input.initialWeightKg?.toString() ?? null,
          medicalNotes: input.medicalNotes,
        });
        await tx.insert(coachStudents).values({
          coachId: coach.id,
          studentId: student.id,
          status: 'active',
        });
      });
    } catch (error) {
      await authContext.internalAdapter.deleteUser(student.id).catch(() => undefined);
      throw error;
    }

    return c.json(
      {
        message: 'حساب و پرونده شاگرد با موفقیت ساخته شد.',
        data: { id: student.id, name: student.name, email: student.email },
      },
      201,
    );
  })
  .post('/invite', zValidator('json', z.object({ email: z.string().email() })), async (c) => {
    const coach = c.get('user');
    const { email } = c.req.valid('json');
    const [student] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!student || student.role !== 'student') {
      return c.json({ message: 'شاگردی با این ایمیل پیدا نشد.' }, 404);
    }

    await db
      .insert(coachStudents)
      .values({ coachId: coach.id, studentId: student.id, status: 'active' })
      .onConflictDoUpdate({
        target: [coachStudents.coachId, coachStudents.studentId],
        set: { status: 'active', endedAt: null },
      });

    return c.json({ message: 'شاگرد به فهرست شما اضافه شد.' }, 201);
  });
