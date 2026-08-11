import { useQuery, useQueryClient } from '@tanstack/react-query';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Camera, Filter, MoreVertical, Play, Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ExerciseImage } from '@/components/exercise-image';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, isDemoMode } from '@/lib/api';
import { demoExercises, type DemoExercise } from '@/lib/demo-data';
import { exerciseSchema, type ExerciseFormValues } from '@/lib/form-schemas';

const groups = ['همه', 'سینه', 'پا', 'پشت', 'مرکزی', 'همسترینگ', 'سرشانه'];
const difficultyLabel = { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته' } as const;

type ApiExercise = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  muscleGroup: string;
  equipment: string;
  difficulty: keyof typeof difficultyLabel;
  media: Array<{ id: string; mediaType: 'image' | 'video'; url: string }>;
};

function toDemoExercise(item: ApiExercise): DemoExercise {
  const image = item.media.find((media) => media.mediaType === 'image')?.url ?? '/pwa-512x512.png';
  const video = item.media.find((media) => media.mediaType === 'video')?.url;
  return {
    id: item.id,
    title: item.title,
    muscleGroup: item.muscleGroup,
    equipment: item.equipment,
    difficulty: difficultyLabel[item.difficulty],
    description: item.description,
    instructions: item.instructions,
    image,
    ...(video ? { video } : {}),
  };
}

export function CoachExercisesPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('همه');
  const [demoItems, setDemoItems] = useState(demoExercises);
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<DemoExercise | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: valibotResolver(exerciseSchema),
    defaultValues: {
      title: '',
      muscleGroup: '',
      equipment: '',
      description: '',
      instructions: '',
      file: null,
    },
  });
  const file = watch('file');

  const exercisesQuery = useQuery({
    queryKey: ['coach', 'exercises'],
    queryFn: () => apiFetch<{ data: ApiExercise[] }>('/api/coach/exercises', { demoRole: 'coach' }),
    enabled: !isDemoMode,
  });

  const items = useMemo(
    () => (isDemoMode ? demoItems : (exercisesQuery.data?.data ?? []).map(toDemoExercise)),
    [demoItems, exercisesQuery.data],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => (group === 'همه' || item.muscleGroup === group) && item.title.includes(query),
      ),
    [group, items, query],
  );

  const resetForm = () => {
    reset({
      title: '',
      muscleGroup: '',
      equipment: '',
      description: '',
      instructions: '',
      file: null,
    });
  };

  const addExercise = async ({ file, ...newExercise }: ExerciseFormValues) => {
    try {
      if (isDemoMode) {
        const item: DemoExercise = {
          id: crypto.randomUUID(),
          title: newExercise.title,
          muscleGroup: newExercise.muscleGroup,
          equipment: newExercise.equipment || 'بدون وسیله',
          description: newExercise.description,
          instructions: newExercise.instructions,
          difficulty: 'مبتدی',
          image: file?.type.startsWith('image/') ? URL.createObjectURL(file) : '/pwa-512x512.png',
          ...(file?.type.startsWith('video/') ? { video: URL.createObjectURL(file) } : {}),
        };
        setDemoItems((current) => [item, ...current]);
      } else {
        const created = await apiFetch<{ data: ApiExercise }>('/api/coach/exercises', {
          method: 'POST',
          demoRole: 'coach',
          body: JSON.stringify({
            title: newExercise.title,
            muscleGroup: newExercise.muscleGroup,
            equipment: newExercise.equipment || 'بدون وسیله',
            description: newExercise.description,
            instructions: newExercise.instructions,
            difficulty: 'beginner',
          }),
        });

        if (file) {
          const presigned = await apiFetch<{
            data: { uploadUrl: string; storageKey: string; publicUrl: string };
          }>('/api/uploads/presign', {
            method: 'POST',
            demoRole: 'coach',
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              size: file.size,
              entityType: 'exercise',
              entityId: created.data.id,
            }),
          });
          const uploadResponse = await fetch(presigned.data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          if (!uploadResponse.ok) throw new Error('آپلود فایل ناموفق بود.');
          await apiFetch('/api/uploads/exercise-media', {
            method: 'POST',
            demoRole: 'coach',
            body: JSON.stringify({
              exerciseId: created.data.id,
              storageKey: presigned.data.storageKey,
              url: presigned.data.publicUrl,
              mimeType: file.type,
              fileSize: file.size,
            }),
          });
        }
        await queryClient.invalidateQueries({ queryKey: ['coach', 'exercises'] });
      }
      resetForm();
      setCreateOpen(false);
      setNotice('حرکت با موفقیت به کتابخانه اضافه شد.');
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ذخیره حرکت ناموفق بود.',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="کتابخانه حرکات"
        description="حرکات را یک‌بار تعریف کن و در برنامه‌های مختلف دوباره استفاده کن."
        action={
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus data-icon="inline-start" /> حرکت جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-h-[min(46rem,calc(100dvh-2rem))] sm:max-w-2xl">
              <DialogHeader className="mb-0 border-b p-5 pe-14">
                <DialogTitle>تعریف حرکت تمرینی</DialogTitle>
                <DialogDescription>
                  عنوان، توضیحات اجرای صحیح و فایل آموزشی حرکت را ثبت کن.
                </DialogDescription>
              </DialogHeader>
              <form className="contents" noValidate onSubmit={handleSubmit(addExercise)}>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <FieldGroup className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" data-invalid={Boolean(errors.title)}>
                      <FieldLabel htmlFor="new-exercise-title">عنوان حرکت</FieldLabel>
                      <Input
                        id="new-exercise-title"
                        placeholder="مثلاً پرس سینه دمبل"
                        aria-invalid={Boolean(errors.title)}
                        autoFocus
                        {...register('title')}
                      />
                      <FieldError>{errors.title?.message}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(errors.muscleGroup)}>
                      <FieldLabel htmlFor="new-exercise-muscle">گروه عضلانی</FieldLabel>
                      <Input
                        id="new-exercise-muscle"
                        placeholder="سینه"
                        aria-invalid={Boolean(errors.muscleGroup)}
                        {...register('muscleGroup')}
                      />
                      <FieldError>{errors.muscleGroup?.message}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(errors.equipment)}>
                      <FieldLabel htmlFor="new-exercise-equipment">تجهیزات</FieldLabel>
                      <Input
                        id="new-exercise-equipment"
                        placeholder="دمبل و نیمکت"
                        aria-invalid={Boolean(errors.equipment)}
                        {...register('equipment')}
                      />
                      <FieldError>{errors.equipment?.message}</FieldError>
                    </Field>
                    <Field className="sm:col-span-2" data-invalid={Boolean(errors.description)}>
                      <FieldLabel htmlFor="new-exercise-description">توضیح کوتاه</FieldLabel>
                      <Textarea
                        id="new-exercise-description"
                        placeholder="هدف حرکت و عضلات درگیر را کوتاه بنویس."
                        aria-invalid={Boolean(errors.description)}
                        {...register('description')}
                      />
                      <FieldError>{errors.description?.message}</FieldError>
                    </Field>
                    <Field className="sm:col-span-2" data-invalid={Boolean(errors.instructions)}>
                      <FieldLabel htmlFor="new-exercise-instructions">نحوه اجرای صحیح</FieldLabel>
                      <Textarea
                        id="new-exercise-instructions"
                        placeholder="مراحل اجرا و نکات ایمنی حرکت را بنویس."
                        aria-invalid={Boolean(errors.instructions)}
                        {...register('instructions')}
                      />
                      <FieldError>{errors.instructions?.message}</FieldError>
                    </Field>
                    <Field className="sm:col-span-2" data-invalid={Boolean(errors.file)}>
                      <FieldLabel htmlFor="new-exercise-file">فایل آموزشی (اختیاری)</FieldLabel>
                      <label
                        htmlFor="new-exercise-file"
                        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <Upload className="size-7 text-primary" />
                        <span className="text-sm font-bold">
                          {file ? 'برای تغییر فایل دوباره انتخاب کن' : 'تصویر یا ویدیو انتخاب کن'}
                        </span>
                        {file && (
                          <Badge variant="secondary" className="max-w-full truncate" dir="ltr">
                            {file.name}
                          </Badge>
                        )}
                      </label>
                      <Controller
                        control={control}
                        name="file"
                        render={({ field: { onChange, ref } }) => (
                          <Input
                            id="new-exercise-file"
                            ref={ref}
                            className="sr-only"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                            aria-invalid={Boolean(errors.file)}
                            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                          />
                        )}
                      />
                      <FieldDescription>
                        JPG، PNG، WebP، MP4 یا WebM تا ۱۰۰ مگابایت
                      </FieldDescription>
                      <FieldError>{errors.file?.message}</FieldError>
                    </Field>
                  </FieldGroup>
                </div>
                {errors.root?.message && (
                  <FieldError className="border-t bg-destructive/5 px-4 py-3">
                    {errors.root.message}
                  </FieldError>
                )}
                <DialogFooter className="items-stretch border-t bg-background p-4 sm:items-center">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>
                      انصراف
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Plus data-icon="inline-start" />
                    )}
                    {isSubmitting ? 'در حال ذخیره...' : 'افزودن به کتابخانه'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {notice && (
        <div
          className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary"
          role="status"
        >
          {notice}
        </div>
      )}

      {exercisesQuery.isError && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {exercisesQuery.error.message}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Field className="max-w-md flex-1 gap-0">
          <FieldLabel className="sr-only" htmlFor="exercise-search">
            جست‌وجوی حرکت
          </FieldLabel>
          <Input
            id="exercise-search"
            placeholder="جست‌وجوی حرکت..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="size-4 shrink-0 text-muted-foreground" />
          {groups.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={group === item ? 'default' : 'outline'}
              onClick={() => setGroup(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exercise) => (
          <Card
            key={exercise.id}
            className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
              <ExerciseImage
                src={exercise.image}
                alt={exercise.title}
                className="size-full object-cover transition duration-500 hover:scale-105"
              />
              <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                <Badge>{exercise.muscleGroup}</Badge>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setSelected(exercise)}
                  aria-label={`جزئیات ${exercise.title}`}
                >
                  <MoreVertical />
                </Button>
              </div>
              {exercise.video && (
                <a
                  href={exercise.video}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 grid place-items-center bg-slate-950/15"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-white/90 text-teal-800 shadow-xl">
                    <Play className="size-5 fill-current" />
                  </span>
                </a>
              )}
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{exercise.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {exercise.equipment} • {exercise.difficulty}
                  </p>
                </div>
                <Camera className="size-5 text-teal-700" />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {exercise.description || 'بدون توضیح'}
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => setSelected(exercise)}
              >
                مشاهده جزئیات
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {!filtered.length && !exercisesQuery.isLoading && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Filter />
            </EmptyMedia>
            <EmptyTitle>حرکتی پیدا نشد</EmptyTitle>
            <EmptyDescription>عبارت جست‌وجو یا گروه عضلانی را تغییر بده.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.muscleGroup} • ${selected.equipment} • ${selected.difficulty}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-4">
              <ExerciseImage
                src={selected.image}
                alt={selected.title}
                className="aspect-video w-full rounded-xl object-cover"
              />
              <div>
                <h3 className="text-sm font-bold">توضیح حرکت</h3>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {selected.description || 'توضیحی ثبت نشده است.'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold">نحوه اجرای صحیح</h3>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {selected.instructions || 'راهنمایی ثبت نشده است.'}
                </p>
              </div>
              {selected.video && (
                <Button asChild>
                  <a href={selected.video} target="_blank" rel="noreferrer">
                    <Play data-icon="inline-start" /> پخش ویدیوی آموزشی
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
