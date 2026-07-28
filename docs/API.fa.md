# مسیرهای اصلی API

## عمومی

- `GET /health`
- `GET|POST /api/auth/*`

## مربی

- `GET /api/coach/students`
- `POST /api/coach/students/invite`
- `GET|POST /api/coach/exercises`
- `PATCH|DELETE /api/coach/exercises/:id`
- `GET /api/coach/plans/student/:studentId`
- `GET /api/coach/plans/:id`
- `POST /api/coach/plans`
- `POST /api/coach/plans/:id/publish`
- `GET /api/coach/reports/:studentId`
- `POST /api/coach/reports`

## شاگرد

- `GET /api/student/plans`
- `GET /api/student/workouts/today`
- `PATCH /api/student/workouts/sessions/:sessionId`
- `PATCH /api/student/workouts/sessions/:sessionId/items/:itemId`
- `GET /api/student/reports`

## آپلود

- `POST /api/uploads/presign`
- `POST /api/uploads/exercise-media`
