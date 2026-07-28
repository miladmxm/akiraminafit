import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useMemo, useState, type FormEvent } from 'react';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { apiFetch, isDemoMode } from '@/lib/api';
import { demoStudents, type DemoStudent } from '@/lib/demo-data';
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

type StudentListItem = DemoStudent & {
  phone: string;
  birthDate: string;
  gender: StudentApiRow['gender'];
  heightCm: number;
  medicalNotes: string;
};

const emptyForm = {
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
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<StudentListItem | null>(null);
  const [demoItems, setDemoItems] = useState(demoStudents);

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () =>
      apiFetch<{ data: StudentApiRow[] }>('/api/coach/students', { demoRole: 'coach' }),
    enabled: !isDemoMode,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/api/coach/students', {
        method: 'POST',
        demoRole: 'coach',
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
      setForm(emptyForm);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'students'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const source: StudentListItem[] = isDemoMode
    ? demoItems.map((student) => ({
        ...student,
        phone: '',
        birthDate: '',
        gender: null,
        heightCm: 0,
        medicalNotes: '',
      }))
    : (studentsQuery.data?.data ?? []).map((student) => ({
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

  const createStudent = async (event: FormEvent) => {
    event.preventDefault();
    setNotice('');
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      form.password.length < 8 ||
      !form.goal.trim()
    ) {
      setNotice('نام، ایمیل، موبایل، هدف و رمز عبور حداقل ۸ کاراکتری الزامی است.');
      return;
    }
    if (isDemoMode) {
      setDemoItems((current) => [
        {
          id: crypto.randomUUID(),
          name: form.name,
          email: form.email,
          avatar: initials(form.name),
          goal: form.goal,
          adherence: 0,
          lastWorkout: 'هنوز تمرینی ثبت نشده',
          weight: Number(form.initialWeightKg || 0),
          trend: 0,
        },
        ...current,
      ]);
      setNotice('حساب و پرونده نمایشی شاگرد ساخته شد.');
      setForm(emptyForm);
      setCreateOpen(false);
      return;
    }
    await createMutation.mutateAsync();
  };

  return (
    <>
      <PageHeader
        title="شاگردان"
        description="حساب، پرونده، هدف و برنامه هر شاگرد را یکجا مدیریت کن."
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
              <form onSubmit={(event) => void createStudent(event)}>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="student-name">نام و نام خانوادگی</FieldLabel>
                    <Input
                      id="student-name"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      autoComplete="name"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-phone">شماره موبایل</FieldLabel>
                    <Input
                      id="student-phone"
                      dir="ltr"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      autoComplete="tel"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-email">ایمیل ورود</FieldLabel>
                    <Input
                      id="student-email"
                      dir="ltr"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      autoComplete="email"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-password">رمز عبور اولیه</FieldLabel>
                    <Input
                      id="student-password"
                      dir="ltr"
                      type="password"
                      minLength={8}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="student-goal">هدف تمرینی</FieldLabel>
                    <Textarea
                      id="student-goal"
                      value={form.goal}
                      onChange={(event) => setForm({ ...form, goal: event.target.value })}
                      placeholder="مثلاً کاهش چربی و افزایش استقامت"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-birth-date">تاریخ تولد</FieldLabel>
                    <JalaliDatePicker
                      id="student-birth-date"
                      value={form.birthDate}
                      onChange={(birthDate) => setForm({ ...form, birthDate })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-gender">جنسیت</FieldLabel>
                    <Select
                      value={form.gender}
                      onValueChange={(gender) => setForm({ ...form, gender })}
                    >
                      <SelectTrigger id="student-gender">
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
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-height">قد اولیه (سانتی‌متر)</FieldLabel>
                    <Input
                      id="student-height"
                      type="number"
                      min="1"
                      max="300"
                      step="0.1"
                      value={form.heightCm}
                      onChange={(event) => setForm({ ...form, heightCm: event.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-weight">وزن اولیه (کیلوگرم)</FieldLabel>
                    <Input
                      id="student-weight"
                      type="number"
                      min="1"
                      max="500"
                      step="0.1"
                      value={form.initialWeightKg}
                      onChange={(event) =>
                        setForm({ ...form, initialWeightKg: event.target.value })
                      }
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="student-medical-notes">آسیب‌دیدگی و نکات پزشکی</FieldLabel>
                    <Textarea
                      id="student-medical-notes"
                      value={form.medicalNotes}
                      onChange={(event) => setForm({ ...form, medicalNotes: event.target.value })}
                    />
                  </Field>
                </FieldGroup>
                <Button className="mt-5 w-full" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Plus data-icon="inline-start" />
                  )}
                  {createMutation.isPending ? 'در حال ساخت حساب...' : 'ساخت حساب و پرونده'}
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
