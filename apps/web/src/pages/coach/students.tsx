import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  Dumbbell,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { JalaliDatePicker } from '@/components/jalali-date-picker';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { apiFetch } from '@/lib/api';
import { studentSchema, type StudentFormValues } from '@/lib/form-schemas';
import { formatFaDate, formatFaNumber } from '@/lib/utils';

type StudentApiRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  goal: string | null;
  birthDate: string | null;
  gender: 'male' | 'female' | 'other' | null;
  heightCm: string | null;
  initialWeightKg: string | null;
  medicalNotes: string | null;
};

type StudentListItem = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  goal: string;
  adherence: number;
  lastWorkout: string;
  weight: number;
  trend: number;
  phone: string;
  birthDate: string;
  gender: StudentApiRow['gender'];
  heightCm: number;
  medicalNotes: string;
};

const emptyForm: StudentFormValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  goal: '',
  birthDate: '',
  gender: '',
  heightCm: '',
  initialWeightKg: '',
  medicalNotes: '',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('‌');
}

function genderLabel(gender: StudentApiRow['gender']) {
  if (gender === 'male') return 'مرد';
  if (gender === 'female') return 'زن';
  if (gender === 'other') return 'سایر';
  return 'ثبت نشده';
}

export function CoachStudentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<StudentListItem | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: valibotResolver(studentSchema),
    defaultValues: emptyForm,
  });

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () => apiFetch<{ data: StudentApiRow[] }>('/api/coach/students'),
  });

  const createMutation = useMutation({
    mutationFn: (form: StudentFormValues) =>
      apiFetch<{ message: string }>('/api/coach/students', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          birthDate: form.birthDate || null,
          gender: form.gender || null,
          heightCm: form.heightCm ? Number(form.heightCm) : null,
          initialWeightKg: form.initialWeightKg ? Number(form.initialWeightKg) : null,
        }),
      }),
    onSuccess: async (result) => {
      setNotice(result.message);
      reset(emptyForm);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'students'] });
    },
  });

  const source: StudentListItem[] = (studentsQuery.data?.data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    avatar: initials(student.name),
    goal: student.goal || 'هدف هنوز ثبت نشده',
    adherence: 0,
    lastWorkout: 'بدون تمرین ثبت‌شده',
    weight: Number(student.initialWeightKg ?? 0),
    trend: 0,
    phone: student.phone ?? '',
    birthDate: student.birthDate ?? '',
    gender: student.gender,
    heightCm: Number(student.heightCm ?? 0),
    medicalNotes: student.medicalNotes ?? '',
  }));

  const students = useMemo(
    () =>
      source.filter(
        (student) =>
          student.name.includes(query) || student.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, source],
  );

  const createStudent = async (form: StudentFormValues) => {
    setNotice('');
    try {
      await createMutation.mutateAsync(form);
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ساخت حساب شاگرد ناموفق بود.',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="شاگردان"
        description="حساب، پرونده، هدف و برنامه هر شاگرد را یکجا مدیریت کن."
        action={
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) reset(emptyForm);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus data-icon="inline-start" /> تعریف شاگرد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>تعریف کامل شاگرد</DialogTitle>
                <DialogDescription>
                  حساب ورود و اطلاعات اولیه پرونده را خودت برای شاگرد بساز.
                </DialogDescription>
              </DialogHeader>
              <form noValidate onSubmit={handleSubmit(createStudent)}>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(errors.name)}>
                    <FieldLabel htmlFor="student-name">نام و نام خانوادگی</FieldLabel>
                    <Input
                      id="student-name"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      {...register('name')}
                    />
                    <FieldError>{errors.name?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.phone)}>
                    <FieldLabel htmlFor="student-phone">شماره موبایل</FieldLabel>
                    <Input
                      id="student-phone"
                      dir="ltr"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.phone)}
                      {...register('phone')}
                    />
                    <FieldError>{errors.phone?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.email)}>
                    <FieldLabel htmlFor="student-email">ایمیل ورود</FieldLabel>
                    <Input
                      id="student-email"
                      dir="ltr"
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      {...register('email')}
                    />
                    <FieldError>{errors.email?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.password)}>
                    <FieldLabel htmlFor="student-password">رمز عبور اولیه</FieldLabel>
                    <Input
                      id="student-password"
                      dir="ltr"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)}
                      {...register('password')}
                    />
                    <FieldError>{errors.password?.message}</FieldError>
                  </Field>
                  <Field className="sm:col-span-2" data-invalid={Boolean(errors.goal)}>
                    <FieldLabel htmlFor="student-goal">هدف تمرینی</FieldLabel>
                    <Textarea
                      id="student-goal"
                      placeholder="مثلاً کاهش چربی و افزایش استقامت"
                      aria-invalid={Boolean(errors.goal)}
                      {...register('goal')}
                    />
                    <FieldError>{errors.goal?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.birthDate)}>
                    <FieldLabel htmlFor="student-birth-date">تاریخ تولد</FieldLabel>
                    <Controller
                      control={control}
                      name="birthDate"
                      render={({ field }) => (
                        <JalaliDatePicker
                          id="student-birth-date"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <FieldError>{errors.birthDate?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.gender)}>
                    <FieldLabel htmlFor="student-gender">جنسیت</FieldLabel>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="student-gender" aria-invalid={Boolean(errors.gender)}>
                            <SelectValue placeholder="انتخاب جنسیت" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="male">مرد</SelectItem>
                              <SelectItem value="female">زن</SelectItem>
                              <SelectItem value="other">سایر</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError>{errors.gender?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.heightCm)}>
                    <FieldLabel htmlFor="student-height">قد اولیه (سانتی‌متر)</FieldLabel>
                    <Input
                      id="student-height"
                      type="number"
                      min="1"
                      max="300"
                      step="0.1"
                      aria-invalid={Boolean(errors.heightCm)}
                      {...register('heightCm')}
                    />
                    <FieldError>{errors.heightCm?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.initialWeightKg)}>
                    <FieldLabel htmlFor="student-weight">وزن اولیه (کیلوگرم)</FieldLabel>
                    <Input
                      id="student-weight"
                      type="number"
                      min="1"
                      max="500"
                      step="0.1"
                      aria-invalid={Boolean(errors.initialWeightKg)}
                      {...register('initialWeightKg')}
                    />
                    <FieldError>{errors.initialWeightKg?.message}</FieldError>
                  </Field>
                  <Field className="sm:col-span-2" data-invalid={Boolean(errors.medicalNotes)}>
                    <FieldLabel htmlFor="student-medical-notes">آسیب‌دیدگی و نکات پزشکی</FieldLabel>
                    <Textarea
                      id="student-medical-notes"
                      aria-invalid={Boolean(errors.medicalNotes)}
                      {...register('medicalNotes')}
                    />
                    <FieldError>{errors.medicalNotes?.message}</FieldError>
                  </Field>
                  {errors.root?.message && (
                    <FieldError className="sm:col-span-2">{errors.root.message}</FieldError>
                  )}
                </FieldGroup>
                <Button className="mt-5 w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Plus data-icon="inline-start" />
                  )}
                  {isSubmitting ? 'در حال ساخت حساب...' : 'ساخت حساب و پرونده'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {notice && (
        <div className="mb-5 rounded-xl border bg-muted px-4 py-3 text-sm font-bold">{notice}</div>
      )}
      {studentsQuery.isError && (
        <div className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {studentsQuery.error.message}
        </div>
      )}

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-xl border bg-card px-3 shadow-sm">
        <Search className="size-4 text-muted-foreground" />
        <Input
          className="border-0 px-0 shadow-none focus:ring-0"
          placeholder="جستجو با نام یا ایمیل..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => (
          <Card
            key={student.id}
            className="group transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-foreground text-sm font-black text-background">
                  {student.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-black">{student.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Mail className="size-3" /> {student.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelected(student)}
                  aria-label={`مشاهده پرونده ${student.name}`}
                >
                  <MoreHorizontal />
                </Button>
              </div>
              <div className="mt-5 rounded-xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">هدف فعلی</div>
                <div className="mt-1 text-sm font-bold">{student.goal}</div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">پایبندی ۳۰ روزه</span>
                  <span className="font-black">
                    {student.adherence ? `${formatFaNumber(student.adherence)}٪` : '—'}
                  </span>
                </div>
                <Progress value={student.adherence} />
              </div>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">وزن اولیه</div>
                  <div className="mt-1 font-black">
                    {student.weight ? `${formatFaNumber(student.weight)} کیلو` : '—'}
                  </div>
                </div>
                {student.trend !== 0 && (
                  <Badge variant={student.trend < 0 ? 'success' : 'secondary'}>
                    {student.trend < 0 ? <TrendingDown /> : <TrendingUp />}
                    {formatFaNumber(Math.abs(student.trend))} کیلو
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => setSelected(student)}>
                  مشاهده پرونده
                </Button>
                <Button className="flex-1" asChild>
                  <Link to={`/coach/plans/new?studentId=${encodeURIComponent(student.id)}`}>
                    <Dumbbell data-icon="inline-start" /> تعریف برنامه
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {!students.length && !studentsQuery.isLoading && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>شاگردی پیدا نشد</EmptyTitle>
            <EmptyDescription>یک شاگرد جدید تعریف کن یا عبارت جستجو را تغییر بده.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پرونده {selected?.name}</DialogTitle>
            <DialogDescription>اطلاعات اولیه ثبت‌شده توسط مربی</DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-3">
                <dt className="text-muted-foreground">موبایل</dt>
                <dd className="mt-1 font-bold" dir="ltr">
                  {selected.phone || 'ثبت نشده'}
                </dd>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <dt className="text-muted-foreground">تاریخ تولد</dt>
                <dd className="mt-1 font-bold">
                  {selected.birthDate ? formatFaDate(selected.birthDate) : 'ثبت نشده'}
                </dd>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <dt className="text-muted-foreground">جنسیت</dt>
                <dd className="mt-1 font-bold">{genderLabel(selected.gender)}</dd>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <dt className="text-muted-foreground">قد اولیه</dt>
                <dd className="mt-1 font-bold">
                  {selected.heightCm ? `${formatFaNumber(selected.heightCm)} سانتی‌متر` : 'ثبت نشده'}
                </dd>
              </div>
              <div className="rounded-xl bg-muted p-3 sm:col-span-2">
                <dt className="text-muted-foreground">هدف</dt>
                <dd className="mt-1 font-bold">{selected.goal}</dd>
              </div>
              <div className="rounded-xl bg-muted p-3 sm:col-span-2">
                <dt className="text-muted-foreground">نکات پزشکی</dt>
                <dd className="mt-1 font-bold">{selected.medicalNotes || 'موردی ثبت نشده'}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
