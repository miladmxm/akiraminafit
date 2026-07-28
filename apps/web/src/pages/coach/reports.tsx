import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CalendarDays,
  Download,
  Plus,
  Scale,
  TrendingDown,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { JalaliDatePicker } from '@/components/jalali-date-picker';
import { ProgressChart } from '@/components/progress-chart';
import { MetricCard } from '@/components/metric-card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, isDemoMode } from '@/lib/api';
import { bodyProgress, demoStudents } from '@/lib/demo-data';
import { formatFaDate, formatFaNumber } from '@/lib/utils';
import { todayApiValue } from '@/lib/utils';

type StudentRow = { id: string; name: string; email: string };
type BodyReport = {
  id: string;
  recordedAt: string;
  weightKg: string | null;
  bodyFatPercent: string | null;
  muscleMassKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  armRightCm: string | null;
};

const emptyForm = {
  recordedAt: todayApiValue(),
  weightKg: '',
  bodyFatPercent: '',
  muscleMassKg: '',
  waistCm: '',
  chestCm: '',
  armRightCm: '',
  notes: '',
};

const numberOrNull = (value: string) => (value.trim() ? Number(value) : null);

export function CoachReportsPage() {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState(isDemoMode ? demoStudents[0]!.id : '');
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () => apiFetch<{ data: StudentRow[] }>('/api/coach/students', { demoRole: 'coach' }),
    enabled: !isDemoMode,
  });
  const students = isDemoMode ? demoStudents : (studentsQuery.data?.data ?? []);

  useEffect(() => {
    if (!isDemoMode && !studentId && students[0]) setStudentId(students[0].id);
  }, [studentId, students]);

  const reportsQuery = useQuery({
    queryKey: ['coach', 'reports', studentId],
    queryFn: () =>
      apiFetch<{ data: BodyReport[] }>(`/api/coach/reports/${studentId}`, { demoRole: 'coach' }),
    enabled: !isDemoMode && Boolean(studentId),
  });

  const reports = reportsQuery.data?.data ?? [];
  const chartData = useMemo(() => {
    if (isDemoMode) return bodyProgress.slice(-rangeMonths);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - rangeMonths);
    return reports
      .filter((report) => new Date(report.recordedAt) >= cutoff)
      .reverse()
      .map((report) => ({
        date: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(
          new Date(report.recordedAt),
        ),
        weight: Number(report.weightKg ?? 0),
        fat: Number(report.bodyFatPercent ?? 0),
        muscle: Number(report.muscleMassKg ?? 0),
        waist: Number(report.waistCm ?? 0),
      }));
  }, [rangeMonths, reports]);

  const latest = isDemoMode ? null : reports[0];
  const latestWeight = latest?.weightKg ? formatFaNumber(latest.weightKg) : '—';
  const latestFat = latest?.bodyFatPercent ? formatFaNumber(latest.bodyFatPercent) : '—';
  const latestMuscle = latest?.muscleMassKg ? formatFaNumber(latest.muscleMassKg) : '—';

  const exportReports = () => {
    const rows = isDemoMode
      ? bodyProgress.map((item) => [item.date, item.weight, item.fat, item.muscle, item.waist])
      : reports.map((report) => [
          formatFaDate(report.recordedAt),
          report.weightKg ?? '',
          report.bodyFatPercent ?? '',
          report.muscleMassKg ?? '',
          report.waistCm ?? '',
        ]);
    const csv = [['تاریخ', 'وزن', 'درصد چربی', 'توده عضلانی', 'دور کمر'], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fitflow-report-${studentId || 'student'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveReport = async () => {
    if (!studentId) {
      setStatus('ابتدا شاگرد را انتخاب کن.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      if (!isDemoMode) {
        await apiFetch('/api/coach/reports', {
          method: 'POST',
          demoRole: 'coach',
          body: JSON.stringify({
            studentId,
            recordedAt: form.recordedAt,
            weightKg: numberOrNull(form.weightKg),
            heightCm: null,
            bodyFatPercent: numberOrNull(form.bodyFatPercent),
            muscleMassKg: numberOrNull(form.muscleMassKg),
            waistCm: numberOrNull(form.waistCm),
            chestCm: numberOrNull(form.chestCm),
            armRightCm: numberOrNull(form.armRightCm),
            thighRightCm: null,
            notes: form.notes,
          }),
        });
        await queryClient.invalidateQueries({ queryKey: ['coach', 'reports', studentId] });
      }
      setForm(emptyForm);
      setStatus(isDemoMode ? 'گزارش نمایشی ثبت شد.' : 'گزارش جسمانی با موفقیت ثبت شد.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ثبت گزارش ناموفق بود.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="گزارش‌ها و تحلیل پیشرفت"
        description="روند جسمانی و پایبندی شاگردها را در بازه‌های مختلف مقایسه کن."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportReports}>
              <Download data-icon="inline-start" /> خروجی گزارش
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> ثبت وضعیت
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>ثبت وضعیت جسمانی</DialogTitle>
                  <DialogDescription>
                    اندازه‌گیری‌های شاگرد را برای یک تاریخ مشخص ثبت کن.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold">شاگرد</span>
                    <select
                      className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
                      value={studentId}
                      onChange={(event) => setStudentId(event.target.value)}
                    >
                      <option value="" disabled>
                        انتخاب شاگرد
                      </option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-bold">تاریخ</span>
                    <JalaliDatePicker
                      value={form.recordedAt}
                      onChange={(recordedAt) => setForm({ ...form, recordedAt })}
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">وزن (kg)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.weightKg}
                      onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">درصد چربی</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.bodyFatPercent}
                      onChange={(event) => setForm({ ...form, bodyFatPercent: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">توده عضلانی (kg)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.muscleMassKg}
                      onChange={(event) => setForm({ ...form, muscleMassKg: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">دور کمر (cm)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.waistCm}
                      onChange={(event) => setForm({ ...form, waistCm: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">دور سینه (cm)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.chestCm}
                      onChange={(event) => setForm({ ...form, chestCm: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">دور بازو (cm)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.armRightCm}
                      onChange={(event) => setForm({ ...form, armRightCm: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold">یادداشت</span>
                    <Textarea
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    />
                  </label>
                </div>
                {status && (
                  <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">
                    {status}
                  </p>
                )}
                <Button className="mt-5 w-full" disabled={saving} onClick={() => void saveReport()}>
                  {saving ? 'در حال ثبت...' : 'ثبت گزارش'}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {status && (
        <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
          {status}
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <select
          className="h-9 rounded-xl border bg-white px-3 text-sm font-bold"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        >
          <option value="" disabled>
            انتخاب شاگرد
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRangeMonths((current) => (current === 6 ? 12 : 6))}
        >
          <CalendarDays data-icon="inline-start" /> {formatFaNumber(rangeMonths)} ماه اخیر
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="وزن فعلی"
          value={isDemoMode ? '۷۹٫۲ کیلو' : `${latestWeight} کیلو`}
          caption="آخرین ثبت"
          icon={Scale}
        />
        <MetricCard
          label="درصد چربی"
          value={isDemoMode ? '۱۹٫۸٪' : `${latestFat}٪`}
          caption="آخرین ثبت"
          icon={TrendingDown}
        />
        <MetricCard
          label="توده عضلانی"
          value={isDemoMode ? '۵۹٫۴ کیلو' : `${latestMuscle} کیلو`}
          caption="آخرین ثبت"
          icon={Activity}
        />
        <MetricCard
          label="تعداد گزارش‌ها"
          value={isDemoMode ? '۵' : formatFaNumber(reports.length)}
          caption="کل سوابق"
          icon={CalendarDays}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ProgressChart data={chartData} />
        <Card>
          <CardHeader>
            <CardTitle>آخرین وضعیت ثبت‌شده</CardTitle>
            <CardDescription>
              {isDemoMode
                ? 'پنجم مرداد ۱۴۰۵'
                : latest
                  ? formatFaDate(latest.recordedAt)
                  : 'گزارشی ثبت نشده'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(isDemoMode
              ? ([
                  ['وزن', '۷۹٫۲ کیلوگرم'],
                  ['دور کمر', '۹۰٫۴ سانتی‌متر'],
                  ['دور سینه', '۱۰۲ سانتی‌متر'],
                  ['دور بازو', '۳۶٫۱ سانتی‌متر'],
                  ['درصد چربی', '۱۹٫۸ درصد'],
                ] as const)
              : ([
                  ['وزن', latest?.weightKg ? `${formatFaNumber(latest.weightKg)} کیلوگرم` : '—'],
                  ['دور کمر', latest?.waistCm ? `${formatFaNumber(latest.waistCm)} سانتی‌متر` : '—'],
                  [
                    'دور سینه',
                    latest?.chestCm ? `${formatFaNumber(latest.chestCm)} سانتی‌متر` : '—',
                  ],
                  [
                    'دور بازو',
                    latest?.armRightCm ? `${formatFaNumber(latest.armRightCm)} سانتی‌متر` : '—',
                  ],
                  [
                    'درصد چربی',
                    latest?.bodyFatPercent ? `${formatFaNumber(latest.bodyFatPercent)} درصد` : '—',
                  ],
                ] as const)
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm font-black">{value}</div>
                </div>
                <Badge variant="secondary">ثبت‌شده</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>شاگردان</CardTitle>
          <CardDescription>انتخاب سریع برای مشاهده یا ثبت گزارش</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 text-start">شاگرد</th>
                <th className="text-start">ایمیل</th>
                <th className="text-start">وضعیت</th>
                <th className="text-start">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b last:border-0">
                  <td className="py-4 font-bold">{student.name}</td>
                  <td dir="ltr" className="text-start text-muted-foreground">
                    {student.email}
                  </td>
                  <td>
                    <Badge variant="success">فعال</Badge>
                  </td>
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => setStudentId(student.id)}>
                      <UserRound className="size-4" /> انتخاب
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
