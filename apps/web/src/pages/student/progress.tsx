import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarCheck2, Ruler, Scale, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { ProgressChart } from '@/components/progress-chart';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { formatFaDate, formatFaNumber } from '@/lib/utils';

type BodyReport = {
  id: string;
  recordedAt: string;
  weightKg: string | null;
  bodyFatPercent: string | null;
  muscleMassKg: string | null;
  waistCm: string | null;
};

export function StudentProgressPage() {
  const reportsQuery = useQuery({
    queryKey: ['student', 'reports'],
    queryFn: () => apiFetch<{ data: BodyReport[] }>('/api/student/reports'),
  });

  const reports = reportsQuery.data?.data ?? [];
  const chartData = useMemo(() => {
    return reports.map((report) => ({
      date: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(
        new Date(report.recordedAt),
      ),
      weight: Number(report.weightKg ?? 0),
      fat: Number(report.bodyFatPercent ?? 0),
      muscle: Number(report.muscleMassKg ?? 0),
      waist: Number(report.waistCm ?? 0),
    }));
  }, [reports]);

  const latest = reports.at(-1);
  const first = reports[0];
  const difference = (
    latestValue: string | null | undefined,
    firstValue: string | null | undefined,
  ) => {
    if (!latestValue || !firstValue) return null;
    return Number(latestValue) - Number(firstValue);
  };
  const weightChange = difference(latest?.weightKg, first?.weightKg);
  const fatChange = difference(latest?.bodyFatPercent, first?.bodyFatPercent);
  const waistChange = difference(latest?.waistCm, first?.waistCm);

  return (
    <>
      <PageHeader
        title="روند پیشرفت من"
        description="گزارش‌هایی که مربی ثبت کرده و عملکرد تمرینی خودت را اینجا می‌بینی."
      />
      {reportsQuery.isError && (
        <div className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {reportsQuery.error.message}
        </div>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="وزن فعلی"
          value={latest?.weightKg ? `${formatFaNumber(latest.weightKg)} کیلو` : '—'}
          caption="از اولین ثبت"
          icon={Scale}
          trend={
            weightChange == null
              ? undefined
              : {
                  value: `${formatFaNumber(Math.abs(weightChange))} کیلو ${weightChange <= 0 ? 'کاهش' : 'افزایش'}`,
                  positive: weightChange <= 0,
                }
          }
        />
        <MetricCard
          label="درصد چربی"
          value={latest?.bodyFatPercent ? `${formatFaNumber(latest.bodyFatPercent)}٪` : '—'}
          caption="از اولین ثبت"
          icon={TrendingDown}
          trend={
            fatChange == null
              ? undefined
              : {
                  value: `${formatFaNumber(Math.abs(fatChange))}٪ ${fatChange <= 0 ? 'کاهش' : 'افزایش'}`,
                  positive: fatChange <= 0,
                }
          }
        />
        <MetricCard
          label="دور کمر"
          value={latest?.waistCm ? `${formatFaNumber(latest.waistCm)} سانتی‌متر` : '—'}
          caption="از اولین ثبت"
          icon={Ruler}
          trend={
            waistChange == null
              ? undefined
              : {
                  value: `${formatFaNumber(Math.abs(waistChange))} سانت ${waistChange <= 0 ? 'کاهش' : 'افزایش'}`,
                  positive: waistChange <= 0,
                }
          }
        />
        <MetricCard
          label="تعداد گزارش‌ها"
          value={formatFaNumber(reports.length)}
          caption="ثبت‌شده توسط مربی"
          icon={CalendarCheck2}
        />
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ProgressChart
          data={chartData}
          title="تغییر وزن و چربی"
          description="براساس گزارش‌های دوره‌ای ثبت‌شده توسط مربی"
        />
        <Card>
          <CardHeader>
            <CardTitle>خلاصه آخرین گزارش</CardTitle>
            <CardDescription>
              {latest ? formatFaDate(latest.recordedAt) : 'بدون گزارش'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                ['وزن', latest?.weightKg ? `${formatFaNumber(latest.weightKg)} کیلو` : '—'],
                [
                  'درصد چربی',
                  latest?.bodyFatPercent ? `${formatFaNumber(latest.bodyFatPercent)}٪` : '—',
                ],
                [
                  'توده عضلانی',
                  latest?.muscleMassKg ? `${formatFaNumber(latest.muscleMassKg)} کیلو` : '—',
                ],
                ['دور کمر', latest?.waistCm ? `${formatFaNumber(latest.waistCm)} سانت` : '—'],
              ] as const
            ).map(([title, value]) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Activity className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{title}</div>
                  <div className="mt-1 text-sm font-black">{value}</div>
                </div>
                <Badge variant="secondary">آخرین</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تاریخچه گزارش‌های جسمانی</CardTitle>
          <CardDescription>ثبت‌های انجام‌شده توسط مربی</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-3 text-start">تاریخ</th>
                <th className="text-start">وزن</th>
                <th className="text-start">چربی</th>
                <th className="text-start">عضله</th>
                <th className="text-start">دور کمر</th>
              </tr>
            </thead>
            <tbody>
              {[...reports].reverse().map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-4 font-bold">{formatFaDate(row.recordedAt)}</td>
                  <td>{row.weightKg ? `${formatFaNumber(row.weightKg)} kg` : '—'}</td>
                  <td>{row.bodyFatPercent ? `${formatFaNumber(row.bodyFatPercent)}%` : '—'}</td>
                  <td>{row.muscleMassKg ? `${formatFaNumber(row.muscleMassKg)} kg` : '—'}</td>
                  <td>{row.waistCm ? `${formatFaNumber(row.waistCm)} cm` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reports.length && !reportsQuery.isLoading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              هنوز گزارشی برای شما ثبت نشده است.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
