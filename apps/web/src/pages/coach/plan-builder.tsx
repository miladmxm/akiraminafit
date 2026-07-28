import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useSearchParams } from 'react-router-dom';
import { JalaliDatePicker } from '@/components/jalali-date-picker';
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { demoExercises, demoStudents, type DemoExercise } from '@/lib/demo-data';
import { cn, todayApiValue } from '@/lib/utils';

interface PlanItem {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  rest: number;
  weight: number;
  notes: string;
}

interface PlanDay {
  id: string;
  title: string;
  weekday: number | null;
  items: PlanItem[];
}

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

function mapExercise(exercise: ApiExercise): DemoExercise {
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

const initialItems: PlanItem[] = isDemoMode
  ? [
      {
        id: crypto.randomUUID(),
        exerciseId: 'ex-1',
        sets: 4,
        reps: '۸-۱۰',
        rest: 90,
        weight: 16,
        notes: 'یک تکرار در ذخیره نگه‌دار.',
      },
      {
        id: crypto.randomUUID(),
        exerciseId: 'ex-2',
        sets: 3,
        reps: '۱۲',
        rest: 75,
        weight: 18,
        notes: '',
      },
    ]
  : [];

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
  const [studentId, setStudentId] = useState(
    isDemoMode ? demoStudents[0]!.id : (searchParams.get('studentId') ?? ''),
  );
  const [title, setTitle] = useState('دوره افزایش قدرت - فاز اول');
  const [description, setDescription] = useState(
    'سه جلسه در هفته با تمرکز روی حرکات پایه و پیشرفت تدریجی بار تمرین.',
  );
  const [startDate, setStartDate] = useState(todayApiValue);
  const [days, setDays] = useState<PlanDay[]>([
    { id: crypto.randomUUID(), title: 'جلسه اول - تمام بدن A', weekday: 6, items: initialItems },
  ]);
  const [activeDayId, setActiveDayId] = useState(days[0]!.id);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: () => apiFetch<{ data: StudentRow[] }>('/api/coach/students', { demoRole: 'coach' }),
    enabled: !isDemoMode,
  });
  const exercisesQuery = useQuery({
    queryKey: ['coach', 'exercises'],
    queryFn: () => apiFetch<{ data: ApiExercise[] }>('/api/coach/exercises', { demoRole: 'coach' }),
    enabled: !isDemoMode,
  });

  const students = isDemoMode ? demoStudents : (studentsQuery.data?.data ?? []);
  const exercises = useMemo(
    () => (isDemoMode ? demoExercises : (exercisesQuery.data?.data ?? []).map(mapExercise)),
    [exercisesQuery.data],
  );

  useEffect(() => {
    if (!isDemoMode && !studentId && students[0]) setStudentId(students[0].id);
  }, [studentId, students]);

  const activeDay = useMemo(
    () => days.find((day) => day.id === activeDayId) ?? days[0]!,
    [activeDayId, days],
  );

  const addDay = () => {
    const used = new Set(days.map((day) => day.weekday));
    const weekday = weekdayOptions.find((option) => !used.has(option.value))?.value ?? null;
    const next = { id: crypto.randomUUID(), title: `جلسه ${days.length + 1}`, weekday, items: [] };
    setDays((current) => [...current, next]);
    setActiveDayId(next.id);
  };

  const removeDay = () => {
    if (days.length === 1) {
      setStatus('برنامه باید حداقل یک روز تمرینی داشته باشد.');
      return;
    }
    const index = days.findIndex((day) => day.id === activeDay.id);
    const nextDays = days.filter((day) => day.id !== activeDay.id);
    setDays(nextDays);
    setActiveDayId(nextDays[Math.max(0, index - 1)]!.id);
  };

  const addExercise = (exerciseId: string) => {
    setDays((current) =>
      current.map((day) =>
        day.id === activeDay.id
          ? {
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
            }
          : day,
      ),
    );
  };

  const updateItem = (itemId: string, field: keyof PlanItem, value: string | number) => {
    setDays((current) =>
      current.map((day) =>
        day.id === activeDay.id
          ? {
              ...day,
              items: day.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item,
              ),
            }
          : day,
      ),
    );
  };

  const removeItem = (itemId: string) => {
    setDays((current) =>
      current.map((day) =>
        day.id === activeDay.id
          ? { ...day, items: day.items.filter((item) => item.id !== itemId) }
          : day,
      ),
    );
  };

  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= activeDay.items.length) return;
    const nextItems = [...activeDay.items];
    const [item] = nextItems.splice(index, 1);
    if (!item) return;
    nextItems.splice(target, 0, item);
    setDays((current) =>
      current.map((day) => (day.id === activeDay.id ? { ...day, items: nextItems } : day)),
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
    setDays((current) => [...current, copy]);
    setActiveDayId(copy.id);
  };

  const savePlan = async (publish: boolean) => {
    const selectedWeekdays = days.map((day) => day.weekday);
    if (
      !studentId ||
      !title.trim() ||
      !startDate ||
      days.some((day) => day.items.length === 0 || day.weekday === null)
    ) {
      setStatus('شاگرد، تاریخ شروع، روز هفته و حداقل یک حرکت برای هر جلسه الزامی است.');
      return;
    }
    if (new Set(selectedWeekdays).size !== selectedWeekdays.length) {
      setStatus('برای دو جلسه نمی‌توان یک روز هفته یکسان انتخاب کرد.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      if (isDemoMode) {
        setStatus(publish ? 'برنامه نمایشی منتشر شد.' : 'پیش‌نویس نمایشی ذخیره شد.');
      } else {
        const created = await apiFetch<{ data: { id: string } }>('/api/coach/plans', {
          method: 'POST',
          demoRole: 'coach',
          body: JSON.stringify({
            studentId,
            title,
            description,
            startDate,
            endDate: null,
            days: days.map((day, dayIndex) => ({
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
          await apiFetch(`/api/coach/plans/${created.data.id}/publish`, {
            method: 'POST',
            demoRole: 'coach',
          });
        }
        await queryClient.invalidateQueries({ queryKey: ['student', 'plans'] });
        setStatus(publish ? 'برنامه با موفقیت منتشر شد.' : 'پیش‌نویس با موفقیت ذخیره شد.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ذخیره برنامه ناموفق بود.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="برنامه‌ساز تمرینی"
        description="روزهای تمرین را تعریف کن، حرکت‌ها را از کتابخانه انتخاب کن و برنامه را برای شاگرد منتشر کن."
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled={saving} onClick={() => void savePlan(false)}>
              {saving ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}{' '}
              ذخیره پیش‌نویس
            </Button>
            <Button disabled={saving} onClick={() => void savePlan(true)}>
              {saving ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}{' '}
              انتشار برنامه
            </Button>
          </div>
        }
      />

      {status && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
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
                <Field>
                  <FieldLabel htmlFor="plan-student">شاگرد</FieldLabel>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger id="plan-student">
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
                </Field>
                <Field>
                  <FieldLabel htmlFor="plan-title">عنوان برنامه</FieldLabel>
                  <Input
                    id="plan-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="plan-description">توضیحات</FieldLabel>
                  <Textarea
                    id="plan-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="plan-start-date">تاریخ شروع</FieldLabel>
                  <JalaliDatePicker
                    id="plan-start-date"
                    value={startDate}
                    onChange={setStartDate}
                    required
                  />
                  <FieldDescription>
                    تاریخ پایان پس از انتشار برنامه بعدی، خودکار تنظیم می‌شود.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>روزهای برنامه</CardTitle>
                <CardDescription>{days.length} جلسه تعریف شده</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addDay}>
                <Plus className="size-4" /> روز
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {days.map((day, index) => (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-start transition',
                    day.id === activeDay.id
                      ? 'border-primary bg-primary/5'
                      : 'bg-card hover:bg-muted',
                  )}
                >
                  <div className="grid size-9 place-items-center rounded-xl bg-slate-900 text-xs font-black text-white">
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
                    className="max-w-sm font-black"
                    value={activeDay.title}
                    onChange={(event) =>
                      setDays((current) =>
                        current.map((day) =>
                          day.id === activeDay.id ? { ...day, title: event.target.value } : day,
                        ),
                      )
                    }
                  />
                  <Select
                    value={activeDay.weekday === null ? '' : String(activeDay.weekday)}
                    onValueChange={(value) =>
                      setDays((current) =>
                        current.map((day) =>
                          day.id === activeDay.id ? { ...day, weekday: Number(value) } : day,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="w-40">
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
                </div>
                <CardDescription>ترتیب و پارامترهای هر حرکت را تنظیم کن.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" size="icon" onClick={removeDay} aria-label="حذف روز">
                  <Trash2 />
                </Button>
                <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus data-icon="inline-start" /> افزودن حرکت
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>انتخاب از کتابخانه</DialogTitle>
                      <DialogDescription>
                        حرکت موردنظر را به {activeDay.title} اضافه کن.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {exercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          onClick={() => addExercise(exercise.id)}
                          className="flex items-center gap-3 rounded-xl border p-3 text-start hover:border-primary hover:bg-primary/5"
                        >
                          <img
                            className="size-16 rounded-xl object-cover"
                            src={exercise.image}
                            alt=""
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-black">{exercise.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {exercise.muscleGroup} • {exercise.equipment}
                            </div>
                          </div>
                          <Plus className="size-4 text-primary" />
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-4">
              {activeDay.items.map((item, index) => {
                const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                if (!exercise) return null;
                return (
                  <div key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <GripVertical className="mt-4 hidden size-5 shrink-0 text-slate-300 sm:block" />
                      <img
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
                          variant="ghost"
                          size="icon"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === activeDay.items.length - 1}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground">ست</span>
                        <Input
                          type="number"
                          min="1"
                          value={item.sets}
                          onChange={(event) =>
                            updateItem(item.id, 'sets', Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground">تکرار</span>
                        <Input
                          value={item.reps}
                          onChange={(event) => updateItem(item.id, 'reps', event.target.value)}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          وزن (kg)
                        </span>
                        <Input
                          type="number"
                          min="0"
                          value={item.weight}
                          onChange={(event) =>
                            updateItem(item.id, 'weight', Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          استراحت (ث)
                        </span>
                        <Input
                          type="number"
                          min="0"
                          value={item.rest}
                          onChange={(event) =>
                            updateItem(item.id, 'rest', Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="col-span-2 space-y-1 sm:col-span-1">
                        <span className="text-[11px] font-bold text-muted-foreground">یادداشت</span>
                        <Input
                          value={item.notes}
                          onChange={(event) => updateItem(item.id, 'notes', event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}

              {activeDay.items.length === 0 && (
                <div className="grid min-h-72 place-items-center rounded-2xl border-2 border-dashed bg-slate-50 text-center">
                  <div>
                    <Dumbbell className="mx-auto size-10 text-slate-300" />
                    <p className="mt-3 font-black">هنوز حرکتی اضافه نشده</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      از کتابخانه یک یا چند حرکت انتخاب کن.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-2 border-t pt-5">
              <Button variant="ghost" onClick={duplicateDay}>
                <Copy className="size-4" /> تکثیر این روز
              </Button>
              <div className="text-xs text-muted-foreground">
                مجموع: {activeDay.items.length} حرکت و{' '}
                {activeDay.items.reduce((sum, item) => sum + item.sets, 0)} ست
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
