import { valibotResolver } from '@hookform/resolvers/valibot';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Play, Plus, Trash2, Upload, Video, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ExerciseMediaGallery } from '@/components/exercise-media-gallery';
import { PageHeader } from '@/components/page-header';
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
  EXERCISE_MEDIA_ACCEPT,
  type ExerciseMediaItem,
  type ExerciseRecord,
  uploadExerciseMedia,
} from '@/lib/exercise-media';
import { mediaUploadSchema, type MediaUploadFormValues } from '@/lib/form-schemas';
import { formatFaNumber } from '@/lib/utils';

type ManagedMedia = ExerciseMediaItem & { exerciseId: string; exerciseTitle: string };

export function CoachMediaPage() {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<ManagedMedia | null>(null);
  const [deleting, setDeleting] = useState<ManagedMedia | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MediaUploadFormValues>({
    resolver: valibotResolver(mediaUploadSchema),
    defaultValues: { exerciseId: '', files: [] },
  });
  const selectedFiles = watch('files');

  const exercisesQuery = useQuery({
    queryKey: ['coach', 'exercises'],
    queryFn: () => apiFetch<{ data: ExerciseRecord[] }>('/api/coach/exercises'),
  });
  const exercises = exercisesQuery.data?.data ?? [];
  const media = useMemo<ManagedMedia[]>(
    () =>
      exercises.flatMap((exercise) =>
        exercise.media.map((item) => ({
          ...item,
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
        })),
      ),
    [exercises],
  );

  const closeUpload = () => {
    reset({ exerciseId: '', files: [] });
    setUploadOpen(false);
  };

  const upload = async ({ exerciseId, files }: MediaUploadFormValues) => {
    try {
      await uploadExerciseMedia(exerciseId, files);
      await queryClient.invalidateQueries({ queryKey: ['coach', 'exercises'] });
      closeUpload();
      setNotice(`${formatFaNumber(files.length)} فایل با موفقیت آپلود شد.`);
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'آپلود فایل‌ها ناموفق بود.',
      });
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setDeletePending(true);
    setDeleteError('');
    try {
      await apiFetch(`/api/uploads/exercise-media/${deleting.id}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: ['coach', 'exercises'] });
      setDeleting(null);
      setNotice('فایل از فضای ذخیره‌سازی و کتابخانه حذف شد.');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'حذف فایل ناموفق بود.');
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="مدیریت مدیا"
        description="تصاویر و ویدیوهای آموزشی حرکات را از یک مکان آپلود یا حذف کن."
        action={
          <Dialog
            open={uploadOpen}
            onOpenChange={(open) => {
              setUploadOpen(open);
              if (!open) reset({ exerciseId: '', files: [] });
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus data-icon="inline-start" /> آپلود مدیا
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>آپلود فایل‌های آموزشی</DialogTitle>
                <DialogDescription>هر فایل به حرکت انتخاب‌شده اضافه می‌شود.</DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit(upload)}>
                <FieldGroup>
                  <Field data-invalid={Boolean(errors.exerciseId)}>
                    <FieldLabel htmlFor="media-exercise">حرکت مرتبط</FieldLabel>
                    <Controller
                      control={control}
                      name="exerciseId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id="media-exercise"
                            aria-invalid={Boolean(errors.exerciseId)}
                          >
                            <SelectValue placeholder="یک حرکت انتخاب کن" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {exercises.map((exercise) => (
                                <SelectItem key={exercise.id} value={exercise.id}>
                                  {exercise.title}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError>{errors.exerciseId?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(errors.files)}>
                    <FieldLabel htmlFor="media-files">فایل‌های آموزشی</FieldLabel>
                    <Controller
                      control={control}
                      name="files"
                      render={({ field: { onChange, ref } }) => (
                        <label
                          htmlFor="media-files"
                          className="relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed bg-muted/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-within:ring-2 focus-within:ring-primary/30"
                        >
                          <Upload className="size-7 text-primary" />
                          <span className="text-sm font-bold">تصویرها و ویدیوها را انتخاب کن</span>
                          <span className="text-xs text-muted-foreground">
                            حداکثر ۱۰ فایل در هر بار
                          </span>
                          <input
                            id="media-files"
                            ref={ref}
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                            type="file"
                            multiple
                            accept={EXERCISE_MEDIA_ACCEPT}
                            aria-invalid={Boolean(errors.files)}
                            onChange={(event) => {
                              onChange([...selectedFiles, ...Array.from(event.target.files ?? [])]);
                              event.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${file.lastModified}`}
                            className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2"
                          >
                            {file.type.startsWith('video/') ? (
                              <Video className="size-4" />
                            ) : (
                              <ImageIcon className="size-4" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm" dir="ltr">
                              {file.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setValue(
                                  'files',
                                  selectedFiles.filter((_, itemIndex) => itemIndex !== index),
                                  { shouldValidate: true },
                                )
                              }
                              aria-label={`حذف ${file.name} از لیست`}
                            >
                              <X />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <FieldDescription>
                      JPG، PNG، WebP، MP4 یا WebM؛ حداکثر ۱۰۰ مگابایت برای هر فایل
                    </FieldDescription>
                    <FieldError>{errors.files?.message}</FieldError>
                  </Field>
                </FieldGroup>
                {errors.root?.message && <FieldError>{errors.root.message}</FieldError>}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>
                      انصراف
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Upload data-icon="inline-start" />
                    )}
                    {isSubmitting ? 'در حال آپلود...' : 'آپلود فایل‌ها'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{formatFaNumber(media.length)} فایل</Badge>
        <Badge variant="outline">
          {formatFaNumber(media.filter((item) => item.mediaType === 'image').length)} تصویر
        </Badge>
        <Badge variant="outline">
          {formatFaNumber(media.filter((item) => item.mediaType === 'video').length)} ویدیو
        </Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <button
              type="button"
              className="relative aspect-video w-full overflow-hidden bg-brand"
              onClick={() => setPreview(item)}
            >
              {item.mediaType === 'image' ? (
                <img src={item.url} alt={item.exerciseTitle} className="size-full object-cover" />
              ) : (
                <>
                  <video
                    src={item.url}
                    muted
                    preload="metadata"
                    crossOrigin="anonymous"
                    className="size-full object-cover"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-[var(--overlay)] text-primary-foreground">
                    <Play className="size-8" />
                  </span>
                </>
              )}
            </button>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{item.exerciseTitle}</CardTitle>
                  <CardDescription>
                    {item.mediaType === 'image' ? 'تصویر آموزشی' : 'ویدیوی آموزشی'}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{item.mediaType === 'image' ? 'تصویر' : 'ویدیو'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="truncate text-xs text-muted-foreground" dir="ltr">
                {item.storageKey ?? item.url}
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreview(item)}>
                پیش‌نمایش
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setDeleting(item)}
                aria-label={`حذف مدیای ${item.exerciseTitle}`}
              >
                <Trash2 />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      {!media.length && !exercisesQuery.isLoading && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>هنوز مدیایی نداری</EmptyTitle>
            <EmptyDescription>
              اولین تصویر یا ویدیوی آموزشی را برای یک حرکت آپلود کن.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.exerciseTitle}</DialogTitle>
            <DialogDescription>پیش‌نمایش فایل آموزشی</DialogDescription>
          </DialogHeader>
          {preview && (
            <ExerciseMediaGallery
              items={
                exercises.find((exercise) => exercise.id === preview.exerciseId)?.media ?? [preview]
              }
              title={preview.exerciseTitle}
              initialId={preview.id}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setDeleteError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حذف فایل آموزشی؟</DialogTitle>
            <DialogDescription>
              این فایل برای حرکت «{deleting?.exerciseTitle}» از ذخیره‌ساز هم حذف می‌شود و قابل
              بازگردانی نیست.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <FieldError>{deleteError}</FieldError>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deletePending}>
                انصراف
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={() => void remove()}
            >
              {deletePending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              {deletePending ? 'در حال حذف...' : 'حذف نهایی'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
