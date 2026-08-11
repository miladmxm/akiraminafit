import { valibotResolver } from '@hookform/resolvers/valibot';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Edit3, Filter, Images, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ExerciseFormFields } from '@/components/exercise-form-fields';
import { EXERCISE_PLACEHOLDER_SRC, ExerciseImage } from '@/components/exercise-image';
import { ExerciseMediaGallery } from '@/components/exercise-media-gallery';
import { PageHeader } from '@/components/page-header';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api';
import {
  type ExerciseMediaItem,
  type ExerciseRecord,
  uploadExerciseMedia,
} from '@/lib/exercise-media';
import { exerciseSchema, type ExerciseFormValues } from '@/lib/form-schemas';

const difficultyLabel = { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته' } as const;

const emptyValues: ExerciseFormValues = {
  title: '',
  muscleGroup: '',
  equipment: '',
  description: '',
  instructions: '',
  difficulty: 'beginner',
  files: [],
};

type ExerciseEditorProps = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ExerciseFormValues>;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
  existingMedia?: ExerciseMediaItem[];
  muscleGroups: string[];
};

function ExerciseEditor({
  mode,
  open,
  onOpenChange,
  form,
  onSubmit,
  existingMedia = [],
  muscleGroups,
}: ExerciseEditorProps) {
  const files = form.watch('files');
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button>
            <Plus data-icon="inline-start" /> حرکت جدید
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-h-[min(48rem,calc(100dvh-2rem))] sm:max-w-2xl">
        <DialogHeader className="mb-0 shrink-0 border-b p-5 pe-14">
          <DialogTitle>{mode === 'create' ? 'تعریف حرکت تمرینی' : 'ویرایش حرکت'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'مشخصات حرکت و یک یا چند فایل آموزشی را ثبت کن.'
              : 'متن، سطح سختی و فایل‌های جدید را به‌روز کن.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {mode === 'edit' && existingMedia.length > 0 && (
              <Card className="mb-5">
                <CardHeader>
                  <CardTitle>فایل‌های فعلی</CardTitle>
                  <CardDescription>
                    {existingMedia.length} فایل از قبل به این حرکت متصل است.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExerciseMediaGallery items={existingMedia} title={form.getValues('title')} />
                </CardContent>
              </Card>
            )}
            <ExerciseFormFields
              idPrefix={mode === 'create' ? 'new-exercise' : 'edit-exercise'}
              control={form.control}
              register={form.register}
              setValue={form.setValue}
              errors={form.formState.errors}
              files={files}
              muscleGroups={muscleGroups}
            />
          </div>
          {form.formState.errors.root?.message && (
            <FieldError className="shrink-0 border-t bg-destructive/5 px-4 py-3">
              {form.formState.errors.root.message}
            </FieldError>
          )}
          <DialogFooter className="shrink-0 items-stretch border-t bg-background p-4 sm:items-center">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                انصراف
              </Button>
            </DialogClose>
            {mode === 'edit' && (
              <Button type="button" variant="outline" asChild>
                <Link to="/coach/media">
                  <Images data-icon="inline-start" /> مدیریت مدیا
                </Link>
              </Button>
            )}
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
                  ? 'افزودن به کتابخانه'
                  : 'ذخیره تغییرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CoachExercisesPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('همه');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ExerciseRecord | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const createForm = useForm<ExerciseFormValues>({
    resolver: valibotResolver(exerciseSchema),
    defaultValues: emptyValues,
  });
  const editForm = useForm<ExerciseFormValues>({
    resolver: valibotResolver(exerciseSchema),
    defaultValues: emptyValues,
  });

  const exercisesQuery = useQuery({
    queryKey: ['coach', 'exercises'],
    queryFn: () => apiFetch<{ data: ExerciseRecord[] }>('/api/coach/exercises'),
  });
  const items = exercisesQuery.data?.data ?? [];
  const muscleGroups = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.muscleGroup.trim()).filter((item) => item.length > 0)),
      ).sort((first, second) => first.localeCompare(second, 'fa')),
    [items],
  );

  useEffect(() => {
    if (group !== 'همه' && !muscleGroups.includes(group)) setGroup('همه');
  }, [group, muscleGroups]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => (group === 'همه' || item.muscleGroup === group) && item.title.includes(query),
      ),
    [group, items, query],
  );
  const selected = items.find((item) => item.id === detailsId) ?? null;
  const editing = items.find((item) => item.id === editingId) ?? null;

  const payload = (values: ExerciseFormValues) => ({
    title: values.title,
    muscleGroup: values.muscleGroup,
    equipment: values.equipment || 'بدون وسیله',
    description: values.description,
    instructions: values.instructions,
    difficulty: values.difficulty,
  });

  const addExercise = async (values: ExerciseFormValues) => {
    try {
      const created = await apiFetch<{ data: ExerciseRecord }>('/api/coach/exercises', {
        method: 'POST',
        body: JSON.stringify(payload(values)),
      });
      await uploadExerciseMedia(created.data.id, values.files);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'exercises'] });
      createForm.reset(emptyValues);
      setCreateOpen(false);
      setNotice('حرکت و فایل‌های آموزشی با موفقیت ذخیره شدند.');
    } catch (error) {
      createForm.setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ذخیره حرکت ناموفق بود.',
      });
    }
  };

  const openEdit = (exercise: ExerciseRecord) => {
    editForm.reset({
      title: exercise.title,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      files: [],
    });
    setDetailsId(null);
    setEditingId(exercise.id);
  };

  const editExercise = async (values: ExerciseFormValues) => {
    if (!editing) return;
    try {
      await apiFetch(`/api/coach/exercises/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload(values)),
      });
      await uploadExerciseMedia(editing.id, values.files);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'exercises'] });
      setEditingId(null);
      editForm.reset(emptyValues);
      setNotice('تغییرات حرکت با موفقیت ذخیره شد.');
    } catch (error) {
      editForm.setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'ویرایش حرکت ناموفق بود.',
      });
    }
  };

  const removeExercise = async () => {
    if (!deleting) return;

    const exercise = deleting;
    setDeletePending(true);
    setDeleteError('');
    try {
      await apiFetch(`/api/coach/exercises/${exercise.id}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: ['coach', 'exercises'] });

      if (detailsId === exercise.id) setDetailsId(null);
      if (editingId === exercise.id) {
        setEditingId(null);
        editForm.reset(emptyValues);
      }
      setDeleting(null);
      setNotice(`حرکت «${exercise.title}» از کتابخانه حذف شد.`);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'حذف حرکت ناموفق بود.');
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="کتابخانه حرکات"
        description="حرکات را یک‌بار تعریف کن، ویرایش کن و در برنامه‌های مختلف دوباره استفاده کن."
        action={
          <ExerciseEditor
            mode="create"
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) createForm.reset(emptyValues);
            }}
            form={createForm}
            onSubmit={addExercise}
            muscleGroups={muscleGroups}
          />
        }
      />

      {notice && (
        <p
          className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary"
          role="status"
        >
          {notice}
        </p>
      )}
      {exercisesQuery.isError && (
        <p className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {exercisesQuery.error.message}
        </p>
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
        <Field className="w-full gap-0 lg:w-60">
          <FieldLabel className="sr-only" htmlFor="exercise-muscle-filter">
            فیلتر گروه عضلانی
          </FieldLabel>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger id="exercise-muscle-filter">
              <SelectValue placeholder="همه گروه‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="همه">همه گروه‌ها</SelectItem>
                {muscleGroups.map((muscleGroup) => (
                  <SelectItem key={muscleGroup} value={muscleGroup}>
                    {muscleGroup}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exercise) => {
          const cover =
            exercise.media.find((media) => media.mediaType === 'image')?.url ??
            EXERCISE_PLACEHOLDER_SRC;
          return (
            <Card
              key={exercise.id}
              className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                <ExerciseImage
                  src={cover}
                  alt={exercise.title}
                  className="size-full object-cover transition duration-500 hover:scale-105"
                />
                <div className="absolute end-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        aria-label={`عملیات ${exercise.title}`}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => openEdit(exercise)}>
                          <Edit3 />
                          ویرایش
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError('');
                            setDeleting(exercise);
                          }}
                        >
                          <Trash2 />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{exercise.title}</CardTitle>
                    <CardDescription>
                      {exercise.muscleGroup} • {exercise.equipment} •{' '}
                      {difficultyLabel[exercise.difficulty]}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Camera className="me-1 size-3" /> {exercise.media.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {exercise.description || 'بدون توضیح'}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setDetailsId(exercise.id)}
                >
                  مشاهده
                </Button>
              </CardFooter>
            </Card>
          );
        })}
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

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setDetailsId(null)}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.muscleGroup} • ${selected.equipment} • ${difficultyLabel[selected.difficulty]}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-5">
              <ExerciseMediaGallery items={selected.media} title={selected.title} />
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
              <DialogFooter>
                <Button onClick={() => openEdit(selected)}>
                  <Edit3 data-icon="inline-start" /> ویرایش حرکت
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ExerciseEditor
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            editForm.reset(emptyValues);
          }
        }}
        form={editForm}
        onSubmit={editExercise}
        existingMedia={editing?.media ?? []}
        muscleGroups={muscleGroups}
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
            <AlertDialogTitle>حذف حرکت؟</AlertDialogTitle>
            <AlertDialogDescription>
              حرکت «{deleting?.title}» از کتابخانه و انتخاب‌های آینده حذف می‌شود. برنامه‌های قبلی بدون
              تغییر باقی می‌مانند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <FieldError className="mt-4">{deleteError}</FieldError>}
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
                  void removeExercise();
                }}
              >
                {deletePending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Trash2 data-icon="inline-start" />
                )}
                {deletePending ? 'در حال حذف...' : 'حذف حرکت'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
