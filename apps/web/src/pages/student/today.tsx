import { useQuery } from '@tanstack/react-query';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Dumbbell,
  Flame,
  Info,
  Play,
  RotateCcw,
  Scale,
  TimerReset,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EXERCISE_PLACEHOLDER_SRC } from '@/components/exercise-image';
import { ExerciseMediaGallery } from '@/components/exercise-media-gallery';
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
import { Field, FieldError } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, apiUrl } from '@/lib/api';
import type { ExerciseMediaItem } from '@/lib/exercise-media';
import { workoutNoteSchema, type WorkoutNoteFormValues } from '@/lib/form-schemas';
import { enqueueMutation } from '@/lib/offline-queue';
import { cn, formatFaDate, formatFaNumber, percent } from '@/lib/utils';

type TodayApiResponse = {
  data: null | {
    plan: { title: string; description: string };
    day: { title: string; notes: string };
    session: { id: string; studentNote: string };
    items: Array<{
      id: string;
      isCompleted: boolean;
      planned: null | {
        exerciseTitleSnapshot: string;
        exerciseDescriptionSnapshot: string;
        sets: number;
        reps: string;
        restSeconds: number;
        targetWeight: string | null;
        notes: string;
      };
      media: Array<{ mediaType: 'image' | 'video'; url: string }>;
    }>;
  };
  message?: string;
};

type DisplayWorkoutItem = {
  id: string;
  title: string;
  description: string;
  sets: number;
  reps: string;
  rest: number;
  weight: number;
  muscleGroup: string;
  image: string;
  media: ExerciseMediaItem[];
};

export function StudentTodayPage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutNoteFormValues>({
    resolver: valibotResolver(workoutNoteSchema),
    defaultValues: { note: '' },
  });

  const todayQuery = useQuery({
    queryKey: ['student', 'workout', 'today'],
    queryFn: () => apiFetch<TodayApiResponse>('/api/student/workouts/today'),
  });

  const apiData = todayQuery.data?.data ?? null;
  const workoutItems: DisplayWorkoutItem[] = useMemo(() => {
    return (apiData?.items ?? []).flatMap((item) => {
      if (!item.planned) return [];
      const image =
        item.media.find((media) => media.mediaType === 'image')?.url ?? EXERCISE_PLACEHOLDER_SRC;
      return [
        {
          id: item.id,
          title: item.planned.exerciseTitleSnapshot,
          description: item.planned.notes || item.planned.exerciseDescriptionSnapshot,
          sets: item.planned.sets,
          reps: item.planned.reps,
          rest: item.planned.restSeconds,
          weight: Number(item.planned.targetWeight ?? 0),
          muscleGroup: 'تمرین برنامه',
          image,
          media: item.media.map((media, index) => ({
            id: `${item.id}-media-${index}`,
            mediaType: media.mediaType,
            url: media.url,
          })),
        },
      ];
    });
  }, [apiData]);

  useEffect(() => {
    if (apiData) {
      setCompleted(apiData.items.filter((item) => item.isCompleted).map((item) => item.id));
      reset({ note: apiData.session.studentNote ?? '' });
    }
  }, [apiData, reset]);

  const progress = percent(completed.length, workoutItems.length);
  const activeExercise = useMemo(
    () => workoutItems.find((item) => item.id === activeId) ?? null,
    [activeId, workoutItems],
  );

  const queueToggle = async (
    sessionId: string,
    id: string,
    isCompleted: boolean,
    clientMutationId: string,
  ) => {
    await enqueueMutation({
      id: crypto.randomUUID(),
      url: apiUrl(`/api/student/workouts/sessions/${sessionId}/items/${id}`),
      method: 'PATCH',
      body: { isCompleted, clientMutationId },
    });
    setSyncStatus('تغییر در صف همگام‌سازی آفلاین ذخیره شد.');
  };

  const toggle = async (id: string) => {
    const isCompleted = !completed.includes(id);
    const next = isCompleted ? [...completed, id] : completed.filter((item) => item !== id);
    setCompleted(next);

    const sessionId = apiData?.session.id;
    if (!sessionId) return;
    const clientMutationId = crypto.randomUUID();
    if (!navigator.onLine) {
      await queueToggle(sessionId, id, isCompleted, clientMutationId);
      return;
    }

    try {
      await apiFetch(`/api/student/workouts/sessions/${sessionId}/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted, clientMutationId }),
      });
      setSyncStatus('عملکرد تمرین ذخیره شد.');
    } catch (error) {
      if (!navigator.onLine) {
        await queueToggle(sessionId, id, isCompleted, clientMutationId);
      } else {
        setCompleted(completed);
        setSyncStatus(error instanceof Error ? error.message : 'ذخیره وضعیت ناموفق بود.');
      }
    }
  };

  const saveNote = async ({ note }: WorkoutNoteFormValues) => {
    const sessionId = apiData?.session.id;
    if (!sessionId) return;
    try {
      await apiFetch(`/api/student/workouts/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ studentNote: note }),
      });
      setSyncStatus('یادداشت جلسه ذخیره شد.');
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'ذخیره یادداشت ناموفق بود.');
    }
  };

  if (todayQuery.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm font-bold text-muted-foreground">
        در حال دریافت تمرین امروز...
      </div>
    );
  }

  if (!apiData) {
    return (
      <>
        <PageHeader
          title="تمرین امروز"
          description={formatFaDate(new Date(), { weekday: 'long' })}
        />
        <Card>
          <CardContent className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <Dumbbell className="mx-auto size-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-black">امروز تمرینی نداری</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {todayQuery.data?.message ?? 'برنامه فعالی برای امروز پیدا نشد.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const planTitle = apiData.plan.title || 'برنامه فعال';
  const dayTitle = apiData.day.title || 'تمرین امروز';
  const planDescription =
    apiData.day.notes || apiData.plan.description || 'فرم صحیح را در تمام حرکات حفظ کن.';

  return (
    <>
      <PageHeader
        title="تمرین امروز"
        description={`${formatFaDate(new Date(), { weekday: 'long' })} • ${dayTitle}`}
        action={
          <Badge variant={progress === 100 ? 'success' : 'default'} className="px-3 py-2 text-sm">
            {formatFaNumber(progress)}٪ تکمیل
          </Badge>
        }
      />

      {syncStatus && (
        <div className="mb-5 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
          {syncStatus}
        </div>
      )}

      <Card className="mb-6 overflow-hidden border-primary/20 bg-brand text-brand-foreground shadow-xl">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge>برنامه فعال</Badge>
              <h2 className="mt-4 text-2xl font-black">{planTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-brand-foreground/70">{planDescription}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-brand-foreground/10 p-3">
                <Dumbbell className="mx-auto size-5 text-primary" />
                <div className="mt-2 text-lg font-black">{formatFaNumber(workoutItems.length)}</div>
                <div className="text-[10px] text-brand-foreground/70">حرکت</div>
              </div>
              <div className="rounded-2xl bg-brand-foreground/10 p-3">
                <Clock3 className="mx-auto size-5 text-primary" />
                <div className="mt-2 text-lg font-black">
                  {formatFaNumber(Math.max(20, workoutItems.length * 12))}
                </div>
                <div className="text-[10px] text-brand-foreground/70">دقیقه</div>
              </div>
              <div className="rounded-2xl bg-brand-foreground/10 p-3">
                <Flame className="mx-auto size-5 text-primary" />
                <div className="mt-2 text-lg font-black">
                  {formatFaNumber(workoutItems.length * 80)}
                </div>
                <div className="text-[10px] text-brand-foreground/70">امتیاز</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span>
                {completed.length} از {workoutItems.length} حرکت
              </span>
              <span>{formatFaNumber(progress)}٪</span>
            </div>
            <Progress value={progress} className="h-3 bg-brand-foreground/20" />
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        {workoutItems.map((item, index) => {
          const done = completed.includes(item.id);
          return (
            <Card key={item.id} className={cn(done && 'border-success/30 bg-success/5')}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => void toggle(item.id)}
                    className={cn(
                      'mt-1 grid size-10 shrink-0 place-items-center rounded-xl border-2 transition',
                      done
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-primary',
                    )}
                    aria-label={done ? 'علامت‌گذاری به‌عنوان انجام‌نشده' : 'انجام دادم'}
                  >
                    {done ? <Check className="size-5" /> : <Circle className="size-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-muted-foreground">
                        حرکت {formatFaNumber(index + 1)}
                      </span>
                      <Badge variant="secondary">{item.muscleGroup}</Badge>
                      {done && (
                        <Badge variant="success">
                          <CheckCircle2 className="me-1 size-3" /> انجام شد
                        </Badge>
                      )}
                    </div>
                    <h3 className={cn('mt-2 text-lg font-black', done && 'text-success')}>
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border">
                        <Dumbbell className="mx-auto size-4 text-primary" />
                        <div className="mt-1 text-sm font-black">
                          {formatFaNumber(item.sets)} ست
                        </div>
                      </div>
                      <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border">
                        <RotateCcw className="mx-auto size-4 text-primary" />
                        <div className="mt-1 text-sm font-black">{item.reps}</div>
                      </div>
                      <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border">
                        <TimerReset className="mx-auto size-4 text-primary" />
                        <div className="mt-1 text-sm font-black">
                          {formatFaNumber(item.rest)} ثانیه
                        </div>
                      </div>
                      <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border">
                        <Scale className="mx-auto size-4 text-primary" />
                        <div className="mt-1 text-sm font-black">
                          {item.weight ? `${formatFaNumber(item.weight)} کیلو` : 'وزن بدن'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveId(item.id)}>
                        <Play data-icon="inline-start" /> آموزش حرکت
                      </Button>
                      <Button
                        variant={done ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => void toggle(item.id)}
                      >
                        {done ? 'لغو انجام' : 'انجام دادم'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>یادداشت جلسه</CardTitle>
          <CardDescription>احساس کلی، درد احتمالی یا نکته‌ای که مربی باید بداند.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit(saveNote)}>
            <Field data-invalid={Boolean(errors.note)}>
              <Textarea
                placeholder="مثلاً ست آخر پرس سینه سخت بود ولی فرم حفظ شد..."
                aria-invalid={Boolean(errors.note)}
                {...register('note')}
              />
              <FieldError>{errors.note?.message}</FieldError>
            </Field>
            <Button className="mt-3" type="submit" variant="outline" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره یادداشت'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {progress === 100 && workoutItems.length > 0 && (
        <Card className="mt-6 border-warning/30 bg-warning/10">
          <CardContent className="flex flex-col items-center p-7 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-warning/20 text-warning">
              <Trophy className="size-8" />
            </div>
            <h3 className="mt-4 text-xl font-black">تمرین امروز کامل شد!</h3>
            <p className="mt-2 text-sm leading-6 text-warning">
              عالی بود. آب کافی بنوش و زمان ریکاوری را جدی بگیر.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={Boolean(activeExercise)}
        onOpenChange={(open: boolean) => !open && setActiveId(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-3xl">
          {activeExercise && (
            <>
              <DialogHeader>
                <DialogTitle>{activeExercise.title}</DialogTitle>
                <DialogDescription>{activeExercise.description}</DialogDescription>
              </DialogHeader>
              <ExerciseMediaGallery items={activeExercise.media} title={activeExercise.title} />
              <div className="flex flex-col gap-4">
                <div className="rounded-xl bg-info/10 p-4 text-sm leading-7 text-info">
                  <Info className="me-2 inline size-4" />
                  کتف‌ها و ستون فقرات را در وضعیت پایدار نگه دار و دامنه حرکت را فدای وزن بیشتر نکن.
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-muted p-3">{activeExercise.sets} ست</div>
                  <div className="rounded-xl bg-muted p-3">{activeExercise.reps}</div>
                  <div className="rounded-xl bg-muted p-3">{activeExercise.rest} ث استراحت</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
