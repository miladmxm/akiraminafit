import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { auth } from './auth.js';
import { env } from './env.js';
import { requireAuth } from './middleware/auth.js';
import { exercisesRoutes } from './routes/exercises.js';
import { plansRoutes } from './routes/plans.js';
import { coachReportsRoutes, studentReportsRoutes } from './routes/reports.js';
import { studentsRoutes } from './routes/students.js';
import { studentPlansRoutes } from './routes/student-plans.js';
import { uploadsRoutes } from './routes/uploads.js';
import { workoutsRoutes } from './routes/workouts.js';
import type { AppEnv } from './types.js';

const app = new Hono<AppEnv>();
const publicDirectory = fileURLToPath(new URL('../public', import.meta.url));
const hasPublicDirectory = existsSync(publicDirectory);

app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: env.WEB_ORIGIN,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

app.get('/health', (c) => c.json({ status: 'ok', service: 'akiraminafit-api' }));
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.use('/api/*', requireAuth);

app.route('/api/coach/students', studentsRoutes);
app.route('/api/coach/exercises', exercisesRoutes);
app.route('/api/coach/plans', plansRoutes);
app.route('/api/coach/reports', coachReportsRoutes);
app.route('/api/student/reports', studentReportsRoutes);
app.route('/api/student/plans', studentPlansRoutes);
app.route('/api/student/workouts', workoutsRoutes);
app.route('/api/uploads', uploadsRoutes);

if (hasPublicDirectory) {
  app.use('*', serveStatic({ root: publicDirectory }));

  app.get('*', (c, next) => {
    const acceptsHtml = c.req.header('Accept')?.includes('text/html');

    if (
      !acceptsHtml ||
      c.req.path === '/health' ||
      c.req.path === '/api' ||
      c.req.path.startsWith('/api/')
    ) {
      return next();
    }

    return serveStatic({ root: publicDirectory, path: 'index.html' })(c, next);
  });
}

app.notFound((c) => c.json({ message: 'مسیر پیدا نشد.' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json(
    { message: env.NODE_ENV === 'production' ? 'خطای داخلی سرور.' : error.message },
    500,
  );
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`AkiraMinaFit API listening on http://localhost:${info.port}`);
});

export type ApiType = typeof app;
