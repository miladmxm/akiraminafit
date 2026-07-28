import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uploadRequestSchema } from '@fitflow/contracts';
import { bodyReports, db, exerciseMedia, exercises } from '@fitflow/db';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { env } from '../env.js';
import type { AppEnv } from '../types.js';

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
}

export const uploadsRoutes = new Hono<AppEnv>()
  .post('/presign', zValidator('json', uploadRequestSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');
    if (user.role !== 'coach')
      return c.json({ message: 'فقط مربی می‌تواند رسانه بارگذاری کند.' }, 403);
    const ownedEntity =
      input.entityType === 'exercise'
        ? await db
            .select({ id: exercises.id })
            .from(exercises)
            .where(and(eq(exercises.id, input.entityId), eq(exercises.coachId, user.id)))
            .limit(1)
        : await db
            .select({ id: bodyReports.id })
            .from(bodyReports)
            .where(and(eq(bodyReports.id, input.entityId), eq(bodyReports.coachId, user.id)))
            .limit(1);
    if (!ownedEntity[0]) return c.json({ message: 'رکورد مقصد برای آپلود پیدا نشد.' }, 404);
    const key = `${user.id}/${input.entityType}/${input.entityId}/${crypto.randomUUID()}-${safeFileName(input.fileName)}`;
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
      Metadata: {
        owner: user.id,
        entity: input.entityType,
        entityId: input.entityId,
      },
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 10 * 60 });
    return c.json({
      data: {
        uploadUrl,
        storageKey: key,
        publicUrl: `${env.S3_PUBLIC_URL}/${key}`,
        expiresIn: 600,
      },
    });
  })
  .post(
    '/exercise-media',
    zValidator(
      'json',
      z.object({
        exerciseId: z.string().uuid(),
        storageKey: z.string().min(5),
        url: z.string().url(),
        mimeType: z.string().min(3),
        fileSize: z.number().int().positive(),
      }),
    ),
    async (c) => {
      const user = c.get('user');
      const input = c.req.valid('json');
      if (user.role !== 'coach') return c.json({ message: 'دسترسی مجاز نیست.' }, 403);
      const [ownedExercise] = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(and(eq(exercises.id, input.exerciseId), eq(exercises.coachId, user.id)))
        .limit(1);
      if (!ownedExercise) return c.json({ message: 'حرکت پیدا نشد.' }, 404);
      const [created] = await db
        .insert(exerciseMedia)
        .values({
          exerciseId: input.exerciseId,
          storageKey: input.storageKey,
          url: input.url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          mediaType: input.mimeType.startsWith('video/') ? 'video' : 'image',
        })
        .returning();
      return c.json({ data: created }, 201);
    },
  );
