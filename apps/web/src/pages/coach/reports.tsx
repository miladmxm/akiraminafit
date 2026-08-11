import { useQuery, useQueryClient } from '@tanstack/react-query';
import { valibotResolver } from '@hookform/resolvers/valibot';
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
import { Controller, useForm } from 'react-hook-form';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, isDemoMode } from '@/lib/api';
import { bodyProgress, demoStudents } from '@/lib/demo-data';
import { reportSchema, type ReportFormValues } from '@/lib/form-schemas';
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
  const [reportOpen, setReportOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: valibotResolver(reportSchema),
    defaultValues: { ...emptyForm, studentId },
  });

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () => apiFetch<{ data: StudentRow[] }>('/api/coach/students', { demoRole: 'coach' }),
    enabled: !isDemoMode,
  });
  const students = isDemoMode ? demoStudents : (studentsQuery.data?.data ?? []);

  useEffect(() => {
    if (!isDemoMode && !studentId && students[0]) {
      setStudentId(students[0].id);
      if (!getValues('studentId')) setValue('studentId', students[0].id);
    }
  }, [getValues, setValue, studentId, students]);

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
    anchor.download = `akiraminafit-report-${studentId || 'student'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveReport = async (form: ReportFormValues) => {
    setStatus('');
    try {
      if (!isDemoMode) {
        await apiFetch('/api/coach/reports', {
          method: 'POST',
          demoRole: 'coach',
          body: JSON.stringify({
            studentId: form.studentId,
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
        await queryClient.invalidateQueries({ queryKey: ['coach', 'reports', form.studentId] });
      }
      setStudentId(form.studentId);
      reset({ ...emptyForm, studentId: form.studentId });
      setReportOpen(false);
      setStatus(isDemoMode ? 'گزارش نمایشی ثبت شد.' : 'گزارش جسمانی با موفقیت ثبت شد.');
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ثبت گزارش ناموفق بود.',
      });
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
            <Dialog
              open={reportOpen}
              onOpenChange={(open) => {
                setReportOpen(open);
                if (open) reset({ ...emptyForm, studentId });
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus data-icon="inline-start" /> ثبت وضعیت
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>ثبت وضعیت جسمانی</DialogTitle>
                  <DialogDescription>
                    اندازه‌گیری‌های شاگرد را برای یک تاریخ مشخص ثبت کن.
                  </DialogDescription>
                </DialogHeader>
                <form noValidate onSubmit={handleSubmit(saveReport)}>
                  <FieldGroup className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" data-invalid={Boolean(errors.studentId)}>
                      <FieldLabel htmlFor="report-student">شاگرد</FieldLabel>
                      <Controller
                        control={control}
                        name="studentId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger
                              id="report-student"
                              aria-invalid={Boolean(errors.studentId)}
                            >
                              <SelectValue placeholder="انتخاب شاگرد" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {students.map((student) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError>{errors.studentId?.message}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(errors.recordedAt)}>
                      <FieldLabel htmlFor="report-date">تاریخ</FieldLabel>
                      <Controller
                        control={control}
                        name="recordedAt"
                        render={({ field }) => (
                          <JalaliDatePicker
                            id="report-date"
                            value={field.value}
                            onChange={field.onChange}
                            required
                          />
                        )}
                      />
                      <FieldError>{errors.recordedAt?.message}</FieldError>
                    </Field>
                    {(
                      [
                        ['weightKg', 'وزن (kg)'],
                        ['bodyFatPercent', 'درصد چربی'],
                        ['muscleMassKg', 'توده عضلانی (kg)'],
                        ['waistCm', 'دور کمر (cm)'],
                        ['chestCm', 'دور سینه (cm)'],
                        ['armRightCm', 'دور بازو (cm)'],
                      ] as const
                    ).map(([name, label]) => (
                      <Field key={name} data-invalid={Boolean(errors[name])}>
                        <FieldLabel htmlFor={`report-${name}`}>{label}</FieldLabel>
                        <Input
                          id={`report-${name}`}
                          type="number"
                          step="0.1"
                          aria-invalid={Boolean(errors[name])}
                          {...register(name)}
                        />
                        <FieldError>{errors[name]?.message}</FieldError>
                      </Field>
                    ))}
                    <Field className="sm:col-span-2" data-invalid={Boolean(errors.notes)}>
                      <FieldLabel htmlFor="report-notes">یادداشت</FieldLabel>
                      <Textarea
                        id="report-notes"
                        aria-invalid={Boolean(errors.notes)}
                        {...register('notes')}
                      />
                      <FieldError>{errors.notes?.message}</FieldError>
                    </Field>
                    {errors.root?.message && (
                      <FieldError className="sm:col-span-2">{errors.root.message}</FieldError>
                    )}
                  </FieldGroup>
                  <Button className="mt-5 w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Spinner data-icon="inline-start" />}
                    {isSubmitting ? 'در حال ثبت...' : 'ثبت گزارش'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {status && (
        <div className="mb-5 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
          {status}
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <select
          className="h-9 rounded-xl border bg-background px-3 text-sm font-bold"
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
          <CardContent className="flex flex-col gap-3">
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
                className="flex items-center justify-between rounded-xl bg-muted px-4 py-3"
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
                      <UserRound data-icon="inline-start" /> انتخاب
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
