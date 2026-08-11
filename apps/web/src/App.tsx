import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import { installQueueSync } from '@/lib/offline-queue';
import { useStoredRole } from '@/lib/session-store';
import { CoachDashboardPage } from '@/pages/coach/dashboard';
import { CoachExercisesPage } from '@/pages/coach/exercises';
import { CoachMediaPage } from '@/pages/coach/media';
import { CoachPlanBuilderPage } from '@/pages/coach/plan-builder';
import { CoachReportsPage } from '@/pages/coach/reports';
import { CoachStudentsPage } from '@/pages/coach/students';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { StudentPlansPage } from '@/pages/student/plans';
import { StudentProgressPage } from '@/pages/student/progress';
import { StudentTodayPage } from '@/pages/student/today';

export default function App() {
  const role = useStoredRole();
  const queryClient = useQueryClient();

  useEffect(() => installQueueSync(), []);
  useEffect(() => {
    if (!role) queryClient.clear();
  }, [queryClient, role]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={role === 'coach' ? '/coach' : role === 'student' ? '/student' : '/login'}
            replace
          />
        }
      />
      <Route
        path="/login"
        element={
          role ? <Navigate to={role === 'coach' ? '/coach' : '/student'} replace /> : <LoginPage />
        }
      />

      <Route
        path="/coach"
        element={role === 'coach' ? <AppShell role="coach" /> : <Navigate to="/login" replace />}
      >
        <Route index element={<CoachDashboardPage />} />
        <Route path="students" element={<CoachStudentsPage />} />
        <Route path="exercises" element={<CoachExercisesPage />} />
        <Route path="media" element={<CoachMediaPage />} />
        <Route path="plans/new" element={<CoachPlanBuilderPage />} />
        <Route path="reports" element={<CoachReportsPage />} />
      </Route>

      <Route
        path="/student"
        element={
          role === 'student' ? <AppShell role="student" /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<StudentTodayPage />} />
        <Route path="progress" element={<StudentProgressPage />} />
        <Route path="plans" element={<StudentPlansPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
