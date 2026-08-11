import { useQuery, useQueryClient } from '@tanstack/react-query';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Dumbbell,
  GripVertical,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { ExerciseImage } from '@/components/exercise-image';
import { JalaliDatePicker } from '@/components/jalali-date-picker';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { planSchema, type PlanFormValues } from '@/lib/form-schemas';
import { cn, formatFaNumber, todayApiValue } from '@/lib/utils';

type PlanItem = PlanFormValues['days'][number]['items'][number];
type PlanDay = PlanFormValues['days'][number];

type StudentRow = { id: string; name: string };
type ApiExercise = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  media: Array<{ mediaType: 'image' | 'video'; url: string }>;
};

type DisplayExercise = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'مبتدی' | 'متوسط' | 'پیشرفته';
  image: string;
};

function mapExercise(exercise: ApiExercise): DisplayExercise {
  const labels = { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته' } as const;
  return {
    id: exercise.id,
    title: exercise.title,
    description: exercise.description,
    instructions: exercise.instructions,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    difficulty: labels[exercise.difficulty],
    image: exercise.media.find((item) => item.mediaType === 'image')?.url ?? '/pwa-512x512.png',
  };
}

const initialItems: PlanItem[] = [];

const weekdayOptions = [
  { value: 6, label: 'شنبه' },
  { value: 0, label: 'یکشنبه' },
  { value: 1, label: 'دوشنبه' },
  { value: 2, label: 'سه‌شنبه' },
  { value: 3, label: 'چهارشنبه' },
  { value: 4, label: 'پنجشنبه' },
  { value: 5, label: 'جمعه' },
] as const;

export function CoachPlanBuilderPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialDayId = useMemo<string>(() => crypto.randomUUID(), []);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: valibotResolver(planSchema),
    defaultValues: {
      studentId: searchParams.get('studentId') ?? '',
      title: '',
      description: '',
      startDate: todayApiValue(),
      days: [
        {
          id: initialDayId,
          title: 'جلسه اول - تمام بدن A',
          weekday: 6,
          items: initialItems,
        },
      ],
    },
  });
  const days = useWatch({ control, name: 'days' });
  const studentId = useWatch({ control, name: 'studentId' });
  const [activeDayId, setActiveDayId] = useState(initialDayId);
  const [status, setStatus] = useState('');
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish' | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState('');

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () => apiFetch<{ data: StudentRow[] }>('/api/coach/students'),
  });
  const exercisesQuery = useQuery({
    queryKey: ['coach', 'exercises'],
    queryFn: () => apiFetch<{ data: ApiExercise[] }>('/api/coach/exercises'),
  });

  const students = studentsQuery.data?.data ?? [];
  const exercises = useMemo(
    () => (exercisesQuery.data?.data ?? []).map(mapExercise),
    [exercisesQuery.data],
  );

  useEffect(() => {
    if (!studentId && students[0]) {
      setValue('studentId', students[0].id, { shouldValidate: true });
    }
  }, [setValue, studentId, students]);

  const activeDayIndex = useMemo(
    () =>
      Math.max(
        0,
        days.findIndex((day) => day.id === activeDayId),
      ),
    [activeDayId, days],
  );
  const activeDay = days[activeDayIndex] ?? days[0]!;
  const filteredExercises = useMemo(() => {
    const normalizedQuery = exerciseQuery.trim().toLocaleLowerCase('fa');
    if (!normalizedQuery) return exercises;
    return exercises.filter((exercise) =>
      [exercise.title, exercise.muscleGroup, exercise.equipment].some((value) =>
        value.toLocaleLowerCase('fa').includes(normalizedQuery),
      ),
    );
  }, [exerciseQuery, exercises]);
  const addedExerciseIds = useMemo(
    () => new Set(activeDay.items.map((item) => item.exerciseId)),
    [activeDay.items],
  );

  const handleExerciseDialogOpenChange = (open: boolean) => {
    setExerciseDialogOpen(open);
    if (!open) setExerciseQuery('');
  };

  const addDay = () => {
    const used = new Set(days.map((day) => day.weekday));
    const weekday = weekdayOptions.find((option) => !used.has(option.value))?.value ?? null;
    const next = { id: crypto.randomUUID(), title: `جلسه ${days.length + 1}`, weekday, items: [] };
    setValue('days', [...days, next], { shouldDirty: true });
    setActiveDayId(next.id);
  };

  const removeDay = () => {
    if (days.length === 1) {
      setStatus('برنامه باید حداقل یک روز تمرینی داشته باشد.');
      return;
    }
    const index = days.findIndex((day) => day.id === activeDay.id);
    const nextDays = days.filter((day) => day.id !== activeDay.id);
    setValue('days', nextDays, { shouldDirty: true, shouldValidate: true });
    setActiveDayId(nextDays[Math.max(0, index - 1)]!.id);
  };

  const addExercise = (exerciseId: string) => {
    setValue(
      'days',
      days.map((day) =>
        day.id !== activeDay.id || day.items.some((item) => item.exerciseId === exerciseId)
          ? day
          : {
              ...day,
              items: [
                ...day.items,
                {
                  id: crypto.randomUUID(),
                  exerciseId,
                  sets: 3,
                  reps: '۱۲',
                  rest: 60,
                  weight: 0,
                  notes: '',
                },
              ],
            },
      ),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const removeItem = (itemId: string) => {
    setValue(
      'days',
      days.map((day) =>
        day.id === activeDay.id
          ? { ...day, items: day.items.filter((item) => item.id !== itemId) }
          : day,
      ),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= activeDay.items.length) return;
    const nextItems = [...activeDay.items];
    const [item] = nextItems.splice(index, 1);
    if (!item) return;
    nextItems.splice(target, 0, item);
    setValue(
      'days',
      days.map((day) => (day.id === activeDay.id ? { ...day, items: nextItems } : day)),
      { shouldDirty: true },
    );
  };

  const duplicateDay = () => {
    const copy: PlanDay = {
      id: crypto.randomUUID(),
      title: `${activeDay.title} - کپی`,
      weekday:
        weekdayOptions.find((option) => !days.some((day) => day.weekday === option.value))?.value ??
        null,
      items: activeDay.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    };
    setValue('days', [...days, copy], { shouldDirty: true, shouldValidate: true });
    setActiveDayId(copy.id);
  };

  const savePlan = async (form: PlanFormValues, publish: boolean) => {
    setStatus('');
    try {
      const created = await apiFetch<{ data: { id: string } }>('/api/coach/plans', {
        method: 'POST',
        body: JSON.stringify({
          studentId: form.studentId,
          title: form.title,
          description: form.description,
          startDate: form.startDate,
          endDate: null,
          days: form.days.map((day, dayIndex) => ({
            title: day.title,
            dayNumber: dayIndex + 1,
            weekday: day.weekday,
            notes: '',
            exercises: day.items.map((item) => ({
              exerciseId: item.exerciseId,
              sets: item.sets,
              reps: item.reps,
              restSeconds: item.rest,
              targetWeight: item.weight || null,
              targetRpe: null,
              tempo: null,
              notes: item.notes,
            })),
          })),
        }),
      });
      if (publish) {
        await apiFetch(`/api/coach/plans/${created.data.id}/publish`, { method: 'POST' });
      }
      await queryClient.invalidateQueries({ queryKey: ['student', 'plans'] });
      setStatus(publish ? 'برنامه با موفقیت منتشر شد.' : 'پیش‌نویس با موفقیت ذخیره شد.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ذخیره برنامه ناموفق بود.');
    } finally {
      setSubmitIntent(null);
    }
  };

  const handleInvalidPlan = () => {
    setSubmitIntent(null);
    setStatus('لطفاً خطاهای مشخص‌شده در برنامه را برطرف کن.');
  };

  const saveDraft = () => {
    setSubmitIntent('draft');
    void handleSubmit((form) => savePlan(form, false), handleInvalidPlan)();
  };

  return (
    <>
      <PageHeader
        title="برنامه‌ساز تمرینی"
        description="روزهای تمرین را تعریف کن، حرکت‌ها را از کتابخانه انتخاب کن و برنامه را برای شاگرد منتشر کن."
        action={
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={saveDraft}>
              {isSubmitting && submitIntent === 'draft' ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Save data-icon="inline-start" />
              )}{' '}
              ذخیره پیش‌نویس
            </Button>
            <Button
              type="submit"
              form="plan-builder-form"
              disabled={isSubmitting}
              onClick={() => setSubmitIntent('publish')}
            >
              {isSubmitting && submitIntent === 'publish' ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}{' '}
              انتشار برنامه
            </Button>
          </div>
        }
      />

      <form
        id="plan-builder-form"
        noValidate
        onSubmit={handleSubmit((form) => savePlan(form, true), handleInvalidPlan)}
      >
        {status && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
            <Check className="size-5" /> {status}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات برنامه</CardTitle>
                <CardDescription>
                  برنامه از تاریخ شروع تا زمان انتشار برنامه بعدی فعال می‌ماند.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="gap-4">
                  <Field data-invalid={Boolean(errors.studentId)}>
                    <FieldLabel htmlFor="plan-student">شاگرد</FieldLabel>
                    <Controller
                      control={control}
                      name="studentId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="plan-student" aria-invalid={Boolean(errors.studentId)}>
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
                  <Field data-invalid={Boolean(errors.title)}>
                    <FieldLabel htmlFor="plan-title">عنوان برنامه</FieldLabel>
                    <Input
                      id="plan-title"
                      aria-invalid={Boolean(errors.title)}
                      {...register('title')}
                    />
                    <FieldError>{errors.title?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.description)}>
                    <FieldLabel htmlFor="plan-description">توضیحات</FieldLabel>
                    <Textarea
                      id="plan-description"
                      aria-invalid={Boolean(errors.description)}
                      {...register('description')}
                    />
                    <FieldError>{errors.description?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.startDate)}>
                    <FieldLabel htmlFor="plan-start-date">تاریخ شروع</FieldLabel>
                    <Controller
                      control={control}
                      name="startDate"
                      render={({ field }) => (
                        <JalaliDatePicker
                          id="plan-start-date"
                          value={field.value}
                          onChange={field.onChange}
                          required
                        />
                      )}
                    />
                    <FieldDescription>
                      تاریخ پایان پس از انتشار برنامه بعدی، خودکار تنظیم می‌شود.
                    </FieldDescription>
                    <FieldError>{errors.startDate?.message}</FieldError>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>روزهای برنامه</CardTitle>
                  <CardDescription>{days.length} جلسه تعریف شده</CardDescription>
                  <FieldError>{errors.days?.root?.message}</FieldError>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addDay}>
                  <Plus data-icon="inline-start" /> روز
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {days.map((day, index) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-start transition',
                      day.id === activeDay.id
                        ? 'border-primary bg-primary/5'
                        : 'bg-card hover:bg-muted',
                    )}
                  >
                    <div className="grid size-9 place-items-center rounded-xl bg-foreground text-xs font-black text-background">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black">{day.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {day.items.length} حرکت
                      </div>
                    </div>
                    <ChevronLeft className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      key={`title-${activeDay.id}`}
                      className="max-w-sm font-black"
                      aria-label="عنوان جلسه"
                      aria-invalid={Boolean(errors.days?.[activeDayIndex]?.title)}
                      {...register(`days.${activeDayIndex}.title`)}
                    />
                    <Controller
                      key={`weekday-${activeDay.id}`}
                      control={control}
                      name={`days.${activeDayIndex}.weekday`}
                      render={({ field }) => (
                        <Select
                          value={field.value === null ? '' : String(field.value)}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger
                            className="w-40"
                            aria-label="روز هفته"
                            aria-invalid={Boolean(errors.days?.[activeDayIndex]?.weekday)}
                          >
                            <SelectValue placeholder="روز هفته" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {weekdayOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {(errors.days?.[activeDayIndex]?.title?.message ||
                    errors.days?.[activeDayIndex]?.weekday?.message) && (
                    <FieldError>
                      {errors.days[activeDayIndex]?.title?.message ??
                        errors.days[activeDayIndex]?.weekday?.message}
                    </FieldError>
                  )}
                  <CardDescription>ترتیب و پارامترهای هر حرکت را تنظیم کن.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={removeDay}
                    aria-label="حذف روز"
                  >
                    <Trash2 />
                  </Button>
                  <Dialog open={exerciseDialogOpen} onOpenChange={handleExerciseDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button type="button">
                        <Plus data-icon="inline-start" /> افزودن حرکت
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-h-[min(44rem,calc(100dvh-2rem))] sm:max-w-2xl">
                      <DialogHeader className="mb-0 border-b p-5 pe-14">
                        <DialogTitle>انتخاب از کتابخانه</DialogTitle>
                        <DialogDescription>
                          حرکت موردنظر را به {activeDay.title} اضافه کن.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-3 border-b px-5 py-4">
                        <Field className="gap-2">
                          <FieldLabel htmlFor="exercise-library-search" className="sr-only">
                            جست‌وجوی حرکت
                          </FieldLabel>
                          <Input
                            id="exercise-library-search"
                            value={exerciseQuery}
                            onChange={(event) => setExerciseQuery(event.target.value)}
                            placeholder="جست‌وجو با نام، عضله یا تجهیزات..."
                            autoComplete="off"
                            autoFocus
                          />
                        </Field>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            {formatFaNumber(filteredExercises.length)} نتیجه
                          </span>
                          <Badge variant="secondary">
                            {formatFaNumber(activeDay.items.length)} حرکت در این جلسه
                          </Badge>
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        {filteredExercises.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {filteredExercises.map((exercise) => {
                              const isAdded = addedExerciseIds.has(exercise.id);
                              return (
                                <button
                                  key={exercise.id}
                                  type="button"
                                  disabled={isAdded}
                                  onClick={() => addExercise(exercise.id)}
                                  className={cn(
                                    'flex min-h-20 items-center gap-3 rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-100',
                                    isAdded
                                      ? 'border-primary bg-primary/5'
                                      : 'hover:border-primary hover:bg-primary/5',
                                  )}
                                >
                                  <ExerciseImage
                                    className="size-14 shrink-0 rounded-xl object-cover sm:size-16"
                                    src={exercise.image}
                                    alt={exercise.title}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-black">
                                      {exercise.title}
                                    </span>
                                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                                      {exercise.muscleGroup} • {exercise.equipment}
                                    </span>
                                  </span>
                                  {isAdded ? (
                                    <Badge variant="default">اضافه شد</Badge>
                                  ) : (
                                    <Plus className="size-5 shrink-0 text-primary" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty className="min-h-52 border">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <Dumbbell />
                              </EmptyMedia>
                              <EmptyTitle>حرکتی پیدا نشد</EmptyTitle>
                              <EmptyDescription>
                                عبارت دیگری مثل نام عضله یا تجهیزات را امتحان کن.
                              </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setExerciseQuery('')}
                              >
                                پاک‌کردن جست‌وجو
                              </Button>
                            </EmptyContent>
                          </Empty>
                        )}
                      </div>
                      <DialogFooter className="items-center justify-between border-t bg-background p-4 sm:justify-between">
                        <span className="text-xs text-muted-foreground">
                          انتخاب‌ها بلافاصله به انتهای جلسه اضافه می‌شوند.
                        </span>
                        <DialogClose asChild>
                          <Button type="button">
                            <Check data-icon="inline-start" /> پایان انتخاب
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                {activeDay.items.map((item, index) => {
                  const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                  const itemErrors = errors.days?.[activeDayIndex]?.items?.[index];
                  if (!exercise) return null;
                  return (
                    <div key={item.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <GripVertical className="mt-4 hidden size-5 shrink-0 text-muted-foreground sm:block" />
                        <ExerciseImage
                          src={exercise.image}
                          alt={exercise.title}
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black">{exercise.title}</h3>
                            <Badge variant="secondary">{exercise.muscleGroup}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {exercise.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveItem(index, -1)}
                            disabled={index === 0}
                            aria-label={`انتقال ${exercise.title} به بالا`}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveItem(index, 1)}
                            disabled={index === activeDay.items.length - 1}
                            aria-label={`انتقال ${exercise.title} به پایین`}
                          >
                            <ArrowDown />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            aria-label={`حذف ${exercise.title}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <FieldGroup className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <Field className="gap-1" data-invalid={Boolean(itemErrors?.sets)}>
                          <FieldLabel htmlFor={`sets-${item.id}`}>ست</FieldLabel>
                          <Input
                            key={`sets-${item.id}`}
                            id={`sets-${item.id}`}
                            type="number"
                            min="1"
                            aria-invalid={Boolean(itemErrors?.sets)}
                            {...register(`days.${activeDayIndex}.items.${index}.sets`, {
                              valueAsNumber: true,
                            })}
                          />
                          <FieldError>{itemErrors?.sets?.message}</FieldError>
                        </Field>
                        <Field className="gap-1" data-invalid={Boolean(itemErrors?.reps)}>
                          <FieldLabel htmlFor={`reps-${item.id}`}>تکرار</FieldLabel>
                          <Input
                            key={`reps-${item.id}`}
                            id={`reps-${item.id}`}
                            aria-invalid={Boolean(itemErrors?.reps)}
                            {...register(`days.${activeDayIndex}.items.${index}.reps`)}
                          />
                          <FieldError>{itemErrors?.reps?.message}</FieldError>
                        </Field>
                        <Field className="gap-1" data-invalid={Boolean(itemErrors?.weight)}>
                          <FieldLabel htmlFor={`weight-${item.id}`}>وزن (کیلوگرم)</FieldLabel>
                          <Input
                            key={`weight-${item.id}`}
                            id={`weight-${item.id}`}
                            type="number"
                            min="0"
                            aria-invalid={Boolean(itemErrors?.weight)}
                            {...register(`days.${activeDayIndex}.items.${index}.weight`, {
                              valueAsNumber: true,
                            })}
                          />
                          <FieldError>{itemErrors?.weight?.message}</FieldError>
                        </Field>
                        <Field className="gap-1" data-invalid={Boolean(itemErrors?.rest)}>
                          <FieldLabel htmlFor={`rest-${item.id}`}>استراحت (ثانیه)</FieldLabel>
                          <Input
                            key={`rest-${item.id}`}
                            id={`rest-${item.id}`}
                            type="number"
                            min="0"
                            aria-invalid={Boolean(itemErrors?.rest)}
                            {...register(`days.${activeDayIndex}.items.${index}.rest`, {
                              valueAsNumber: true,
                            })}
                          />
                          <FieldError>{itemErrors?.rest?.message}</FieldError>
                        </Field>
                        <Field
                          className="col-span-2 gap-1 sm:col-span-1"
                          data-invalid={Boolean(itemErrors?.notes)}
                        >
                          <FieldLabel htmlFor={`notes-${item.id}`}>یادداشت</FieldLabel>
                          <Input
                            key={`notes-${item.id}`}
                            id={`notes-${item.id}`}
                            aria-invalid={Boolean(itemErrors?.notes)}
                            {...register(`days.${activeDayIndex}.items.${index}.notes`)}
                          />
                          <FieldError>{itemErrors?.notes?.message}</FieldError>
                        </Field>
                      </FieldGroup>
                    </div>
                  );
                })}

                {activeDay.items.length === 0 && (
                  <Empty className="min-h-72 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Dumbbell />
                      </EmptyMedia>
                      <EmptyTitle>هنوز حرکتی اضافه نشده</EmptyTitle>
                      <EmptyDescription>از کتابخانه یک یا چند حرکت انتخاب کن.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button type="button" onClick={() => setExerciseDialogOpen(true)}>
                        <Plus data-icon="inline-start" /> انتخاب اولین حرکت
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}
                {activeDay.items.length === 0 && errors.days?.[activeDayIndex]?.items && (
                  <FieldError>
                    {errors.days[activeDayIndex]?.items?.root?.message ??
                      'حداقل یک حرکت به این جلسه اضافه کن.'}
                  </FieldError>
                )}
              </div>
              <Separator className="my-5" />
              <div className="flex flex-wrap justify-between gap-2">
                <Button type="button" variant="ghost" onClick={duplicateDay}>
                  <Copy data-icon="inline-start" /> تکثیر این روز
                </Button>
                <div className="text-xs text-muted-foreground">
                  مجموع: {activeDay.items.length} حرکت و{' '}
                  {activeDay.items.reduce((sum, item) => sum + item.sets, 0)} ست
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </form>
    </>
  );
}
