import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ChevronLeft, Clock3, Dumbbell } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { apiFetch, isDemoMode } from '@/lib/api';
import { formatFaDate, formatFaNumber, todayApiValue } from '@/lib/utils';

const demoPlanDays = [
  { id: 'day-1', title: 'تمام بدن A', dayNumber: 1, exercises: new Array(4).fill(null) },
  { id: 'day-2', title: 'تمام بدن B', dayNumber: 2, exercises: new Array(5).fill(null) },
  { id: 'day-3', title: 'تمام بدن C', dayNumber: 3, exercises: new Array(4).fill(null) },
];

type StudentPlan = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  days: Array<{
    id: string;
    title: string;
    dayNumber: number;
    exercises: Array<{ id: string }>;
  }>;
};

export function StudentPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<StudentPlan | null>(null);
  const plansQuery = useQuery({
    queryKey: ['student', 'plans'],
    queryFn: () => apiFetch<{ data: StudentPlan[] }>('/api/student/plans', { demoRole: 'student' }),
    enabled: !isDemoMode,
  });

  const plans = plansQuery.data?.data ?? [];
  const currentDate = todayApiValue();
  const activePlan = isDemoMode
    ? {
        id: 'demo-active',
        title: 'دوره افزایش قدرت - فاز اول',
        description: 'سه جلسه در هفته با تمرکز روی حرکات پایه، تکنیک صحیح و افزایش تدریجی وزن.',
        startDate: '2026-08-01',
        endDate: null,
        status: 'active' as const,
        days: demoPlanDays,
      }
    : (plans.find(
        (plan) =>
          plan.status === 'active' &&
          plan.startDate <= currentDate &&
          (!plan.endDate || plan.endDate >= currentDate),
      ) ?? null);
  const previousPlans = isDemoMode ? [] : plans.filter((plan) => plan.id !== activePlan?.id);

  return (
    <>
      <PageHeader
        title="برنامه من"
        description="برنامه فعال، روزهای تمرین و تاریخچه دوره‌های قبلی."
      />
      {plansQuery.isError && (
        <div className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {plansQuery.error.message}
        </div>
      )}

      {activePlan ? (
        <>
          <Card className="overflow-hidden border-primary/20 bg-brand text-brand-foreground">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <Badge>
                    فعال{' '}
                    {activePlan.endDate
                      ? `تا ${formatFaDate(activePlan.endDate)}`
                      : 'تا انتشار برنامه بعدی'}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-black sm:text-3xl">{activePlan.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-foreground/70">
                    {activePlan.description}
                  </p>
                </div>
                <div className="w-full max-w-sm rounded-2xl bg-brand-foreground/10 p-4">
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span>روزهای برنامه</span>
                    <span>{formatFaNumber(activePlan.days.length)} جلسه</span>
                  </div>
                  <Progress value={100} className="bg-brand-foreground/20" />
                  <div className="mt-2 text-xs text-brand-foreground/70">
                    شروع: {formatFaDate(activePlan.startDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {activePlan.days.map((item, index) => (
              <Card key={item.id}>
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <Badge variant="secondary">جلسه {formatFaNumber(item.dayNumber)}</Badge>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </div>
                  {index === 0 && <CheckCircle2 className="size-6 text-success" />}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="size-4" /> {formatFaNumber(item.exercises.length)} حرکت
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-4" /> حدود{' '}
                      {formatFaNumber(Math.max(20, item.exercises.length * 12))} دقیقه
                    </span>
                  </div>
                  <Button
                    className="mt-5 w-full"
                    variant={index === 0 ? 'outline' : 'default'}
                    asChild
                  >
                    <Link to="/student">
                      {index === 0 ? 'مشاهده عملکرد امروز' : 'رفتن به تمرین امروز'}
                      <ChevronLeft data-icon="inline-end" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      ) : (
        <Card>
          <CardContent className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <Dumbbell className="mx-auto size-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-black">برنامه فعالی وجود ندارد</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                پس از انتشار برنامه توسط مربی، اینجا نمایش داده می‌شود.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>سایر برنامه‌ها</CardTitle>
          <CardDescription>برنامه‌های گذشته، آینده و آرشیوشده</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isDemoMode ? (
            <>
              {(
                [
                  ['آمادگی عمومی - شروع', 'فروردین تا اردیبهشت ۱۴۰۵', '۹۲٪'],
                  ['کاهش چربی - فاز اول', 'خرداد تا تیر ۱۴۰۵', '۸۶٪'],
                ] as const
              ).map(([title, date, score]) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <CalendarDays className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black">{title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{date}</div>
                  </div>
                  <Badge variant="success">پایبندی {score}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPlan({
                        id: title,
                        title,
                        description: `پایبندی ثبت‌شده: ${score}`,
                        startDate: '',
                        endDate: null,
                        status: 'completed',
                        days: [],
                      })
                    }
                  >
                    جزئیات <ChevronLeft data-icon="inline-end" />
                  </Button>
                </div>
              ))}
            </>
          ) : (
            previousPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <CalendarDays className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-black">{plan.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatFaDate(plan.startDate)}{' '}
                    {plan.endDate ? `تا ${formatFaDate(plan.endDate)}` : ''}
                  </div>
                </div>
                <Badge variant="secondary">
                  {plan.status === 'completed'
                    ? 'تکمیل‌شده'
                    : plan.status === 'archived'
                      ? 'آرشیو'
                      : plan.startDate > currentDate
                        ? 'زمان‌بندی‌شده'
                        : 'پایان‌یافته'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(plan)}>
                  جزئیات <ChevronLeft data-icon="inline-end" />
                </Button>
              </div>
            ))
          )}
          {!isDemoMode && !previousPlans.length && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              برنامه دیگری وجود ندارد.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlan?.title}</DialogTitle>
            <DialogDescription>جزئیات برنامه تمرینی</DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="flex flex-col gap-3 text-sm">
              <p className="leading-7 text-muted-foreground">
                {selectedPlan.description || 'توضیحی برای این برنامه ثبت نشده است.'}
              </p>
              {selectedPlan.startDate && (
                <div className="rounded-xl bg-muted p-3">
                  شروع: <strong>{formatFaDate(selectedPlan.startDate)}</strong>
                </div>
              )}
              <div className="rounded-xl bg-muted p-3">
                تعداد جلسات: <strong>{formatFaNumber(selectedPlan.days.length)}</strong>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
