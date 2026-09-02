import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  Dumbbell,
  Edit3,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { JalaliDatePicker } from '@/components/jalali-date-picker';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { studentEditSchema, studentSchema, type StudentFormValues } from '@/lib/form-schemas';
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

type StudentEditorProps = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<StudentFormValues>;
  onSubmit: (values: StudentFormValues) => Promise<void>;
};

function StudentEditor({ mode, open, onOpenChange, form, onSubmit }: StudentEditorProps) {
  const idPrefix = mode === 'create' ? 'student' : 'edit-student';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button>
            <UserPlus data-icon="inline-start" /> تعریف شاگرد
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col overflow-clip p-0 sm:max-h-[min(48rem,calc(100dvh-2rem))] sm:max-w-2xl">
        <DialogHeader className="mb-0 shrink-0 border-b p-5 pe-14">
          <DialogTitle>{mode === 'create' ? 'تعریف کامل شاگرد' : 'ویرایش شاگرد'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'حساب ورود و اطلاعات اولیه پرونده را خودت برای شاگرد بساز.'
              : 'اطلاعات حساب و پرونده شاگرد را به‌روز کن.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <FieldGroup className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor={`${idPrefix}-name`}>نام و نام خانوادگی</FieldLabel>
              <Input
                id={`${idPrefix}-name`}
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor={`${idPrefix}-phone`}>شماره موبایل</FieldLabel>
              <Input
                id={`${idPrefix}-phone`}
                dir="ltr"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                {...register('phone')}
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor={`${idPrefix}-email`}>ایمیل ورود</FieldLabel>
              <Input
                id={`${idPrefix}-email`}
                dir="ltr"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>
            {mode === 'create' && (
              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor={`${idPrefix}-password`}>رمز عبور اولیه</FieldLabel>
                <Input
                  id={`${idPrefix}-password`}
                  dir="ltr"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>
            )}
            <Field className="sm:col-span-2" data-invalid={Boolean(errors.goal)}>
              <FieldLabel htmlFor={`${idPrefix}-goal`}>هدف تمرینی</FieldLabel>
              <Textarea
                id={`${idPrefix}-goal`}
                placeholder="مثلاً کاهش چربی و افزایش استقامت"
                aria-invalid={Boolean(errors.goal)}
                {...register('goal')}
              />
              <FieldError>{errors.goal?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.birthDate)}>
              <FieldLabel htmlFor={`${idPrefix}-birth-date`}>تاریخ تولد</FieldLabel>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <JalaliDatePicker
                    id={`${idPrefix}-birth-date`}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.birthDate)}
                    defaultMonth={new Date(new Date().getFullYear() - 25, 0, 1, 12)}
                    maxDate={new Date()}
                  />
                )}
              />
              <FieldError>{errors.birthDate?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.gender)}>
              <FieldLabel htmlFor={`${idPrefix}-gender`}>جنسیت</FieldLabel>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={`${idPrefix}-gender`} aria-invalid={Boolean(errors.gender)}>
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
              <FieldLabel htmlFor={`${idPrefix}-height`}>قد اولیه (سانتی‌متر)</FieldLabel>
              <Input
                id={`${idPrefix}-height`}
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
              <FieldLabel htmlFor={`${idPrefix}-weight`}>وزن اولیه (کیلوگرم)</FieldLabel>
              <Input
                id={`${idPrefix}-weight`}
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
              <FieldLabel htmlFor={`${idPrefix}-medical-notes`}>آسیب‌دیدگی و نکات پزشکی</FieldLabel>
              <Textarea
                id={`${idPrefix}-medical-notes`}
                aria-invalid={Boolean(errors.medicalNotes)}
                {...register('medicalNotes')}
              />
              <FieldError>{errors.medicalNotes?.message}</FieldError>
            </Field>
          </FieldGroup>
          {errors.root?.message && (
            <FieldError className="shrink-0 border-t bg-destructive/5 px-5 py-3">
              {errors.root.message}
            </FieldError>
          )}
          <DialogFooter className="shrink-0 items-stretch border-t bg-background p-4 sm:items-center">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                انصراف
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : mode === 'create' ? (
                <Plus data-icon="inline-start" />
              ) : (
                <Edit3 data-icon="inline-start" />
              )}
              {isSubmitting
                ? 'در حال ذخیره...'
                : mode === 'create'
                  ? 'ساخت حساب و پرونده'
                  : 'ذخیره تغییرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CoachStudentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<StudentListItem | null>(null);
  const [editing, setEditing] = useState<StudentListItem | null>(null);
  const [deleting, setDeleting] = useState<StudentListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const createForm = useForm<StudentFormValues>({
    resolver: valibotResolver(studentSchema),
    defaultValues: emptyForm,
  });
  const editForm = useForm<StudentFormValues>({
    resolver: valibotResolver(studentEditSchema),
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
      createForm.reset(emptyForm);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'students'] });
    },
  });

  const source: StudentListItem[] = (studentsQuery.data?.data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    avatar: initials(student.name),
    goal: student.goal ?? '',
    adherence: 0,
    lastWorkout: 'بدون تمرین ثبت‌شده',
    weight: Number(student.initialWeightKg ?? 0),
    trend: 0,
    phone: student.phone ?? '',
    birthDate: student.birthDate?.slice(0, 10) ?? '',
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
      createForm.setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ساخت حساب شاگرد ناموفق بود.',
      });
    }
  };

  const openEdit = (student: StudentListItem) => {
    editForm.reset({
      name: student.name,
      email: student.email,
      phone: student.phone,
      password: '',
      goal: student.goal,
      birthDate: student.birthDate,
      gender: student.gender ?? '',
      heightCm: student.heightCm ? String(student.heightCm) : '',
      initialWeightKg: student.weight ? String(student.weight) : '',
      medicalNotes: student.medicalNotes,
    });
    setEditing(student);
  };

  const updateStudent = async (form: StudentFormValues) => {
    if (!editing) return;
    setNotice('');
    try {
      const result = await apiFetch<{ message: string }>(`/api/coach/students/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          goal: form.goal,
          birthDate: form.birthDate || null,
          gender: form.gender || null,
          heightCm: form.heightCm ? Number(form.heightCm) : null,
          initialWeightKg: form.initialWeightKg ? Number(form.initialWeightKg) : null,
          medicalNotes: form.medicalNotes,
        }),
      });
      setNotice(result.message);
      setEditing(null);
      editForm.reset(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'students'] });
    } catch (error) {
      editForm.setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ویرایش شاگرد ناموفق بود.',
      });
    }
  };

  const removeStudent = async () => {
    if (!deleting) return;
    const student = deleting;
    setDeletePending(true);
    setDeleteError('');
    setNotice('');
    try {
      const result = await apiFetch<{ message: string }>(`/api/coach/students/${student.id}`, {
        method: 'DELETE',
      });
      setNotice(result.message);
      if (selected?.id === student.id) setSelected(null);
      if (editing?.id === student.id) setEditing(null);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'students'] });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'حذف شاگرد ناموفق بود.');
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="شاگردان"
        description="حساب، پرونده، هدف و برنامه هر شاگرد را یکجا مدیریت کن."
        action={
          <StudentEditor
            mode="create"
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) createForm.reset(emptyForm);
            }}
            form={createForm}
            onSubmit={createStudent}
          />
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`عملیات ${student.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => openEdit(student)}>
                        <Edit3 />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setDeleteError('');
                          setDeleting(student);
                        }}
                      >
                        <Trash2 />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-5 rounded-xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">هدف فعلی</div>
                <div className="mt-1 text-sm font-bold">{student.goal || 'هدف هنوز ثبت نشده'}</div>
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
                <dd className="mt-1 font-bold">{selected.goal || 'ثبت نشده'}</dd>
              </div>
              <div className="rounded-xl bg-muted p-3 sm:col-span-2">
                <dt className="text-muted-foreground">نکات پزشکی</dt>
                <dd className="mt-1 font-bold">{selected.medicalNotes || 'موردی ثبت نشده'}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <StudentEditor
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            editForm.reset(emptyForm);
          }
        }}
        form={editForm}
        onSubmit={updateStudent}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deletePending) {
            setDeleting(null);
            setDeleteError('');
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف شاگرد از فهرست؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleting?.name}» از فهرست شاگردهای شما حذف می‌شود؛ حساب، گزارش‌ها و برنامه‌های قبلی او
              باقی می‌مانند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <FieldError>{deleteError}</FieldError>}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={deletePending}>
                انصراف
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deletePending}
                onClick={(event) => {
                  event.preventDefault();
                  void removeStudent();
                }}
              >
                {deletePending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Trash2 data-icon="inline-start" />
                )}
                {deletePending ? 'در حال حذف...' : 'حذف شاگرد'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
