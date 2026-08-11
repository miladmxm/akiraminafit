import { useQuery } from '@tanstack/react-query';
import { Activity, ClipboardList, Dumbbell, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdherenceChart } from '@/components/adherence-chart';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { formatFaDate, formatFaNumber } from '@/lib/utils';

type DashboardStudent = {
  id: string;
  name: string;
  email: string;
  goal: string | null;
  startedAt: string;
};

type DashboardPlan = { id: string; status: 'draft' | 'active' | 'completed' | 'archived' };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('‌');
}

export function CoachDashboardPage() {
  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () => apiFetch<{ data: DashboardStudent[] }>('/api/coach/students'),
  });
  const exercisesQuery = useQuery({
    queryKey: ['coach', 'exercises'],
    queryFn: () => apiFetch<{ data: Array<{ id: string }> }>('/api/coach/exercises'),
  });
  const students = studentsQuery.data?.data ?? [];
  const plansQuery = useQuery({
    queryKey: ['coach', 'dashboard', 'plans', students.map((student) => student.id)],
    queryFn: async () => {
      const responses = await Promise.all(
        students.map((student) =>
          apiFetch<{ data: DashboardPlan[] }>(`/api/coach/plans/student/${student.id}`),
        ),
      );
      return responses.flatMap((response) => response.data);
    },
    enabled: studentsQuery.isSuccess,
  });
  const plans = plansQuery.data ?? [];
  const activePlans = plans.filter((plan) => plan.status === 'active').length;

  return (
    <>
      <PageHeader
        title="سلام مربی، روزت پرانرژی!"
        description="وضعیت واقعی شاگردها، حرکات و برنامه‌ها را یکجا دنبال کن."
        action={
          <Button asChild>
            <Link to="/coach/plans/new">
              <Plus data-icon="inline-start" /> برنامه جدید
            </Link>
          </Button>
        }
      />

      {(studentsQuery.isError || exercisesQuery.isError || plansQuery.isError) && (
        <p className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          دریافت خلاصه داشبورد ناموفق بود.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="شاگرد فعال"
          value={formatFaNumber(students.length)}
          caption="حساب‌های متصل به مربی"
          icon={Users}
        />
        <MetricCard
          label="حرکات"
          value={formatFaNumber(exercisesQuery.data?.data.length ?? 0)}
          caption="حرکت در کتابخانه"
          icon={Dumbbell}
        />
        <MetricCard
          label="برنامه فعال"
          value={formatFaNumber(activePlans)}
          caption="برنامه‌های منتشرشده"
          icon={ClipboardList}
        />
        <MetricCard
          label="کل برنامه‌ها"
          value={formatFaNumber(plans.length)}
          caption="پیش‌نویس، فعال و آرشیو"
          icon={Activity}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdherenceChart data={[]} />
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>آخرین شاگردها</CardTitle>
              <CardDescription>جدیدترین پرونده‌های متصل به شما</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/coach/students">مشاهده همه</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {students.slice(0, 4).map((student) => (
              <div key={student.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-xs font-black text-background">
                  {initials(student.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{student.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {student.goal || 'هدفی ثبت نشده'}
                  </p>
                </div>
                <Badge variant="secondary">{formatFaDate(student.startedAt)}</Badge>
              </div>
            ))}
            {!students.length && !studentsQuery.isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                هنوز شاگردی ثبت نشده است.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
