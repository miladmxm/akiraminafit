import { coachStudents, db } from '@akiraminafit/db';
import { and, eq } from 'drizzle-orm';

export async function coachCanAccessStudent(coachId: string, studentId: string) {
  const [link] = await db
    .select({ id: coachStudents.id })
    .from(coachStudents)
    .where(
      and(
        eq(coachStudents.coachId, coachId),
        eq(coachStudents.studentId, studentId),
        eq(coachStudents.status, 'active'),
      ),
    )
    .limit(1);

  return Boolean(link);
}
