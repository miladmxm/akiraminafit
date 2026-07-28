import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Filter, MoreVertical, Play, Plus, Search, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, isDemoMode } from '@/lib/api';
import { demoExercises, type DemoExercise } from '@/lib/demo-data';

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
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<DemoExercise | null>(null);
  const [newExercise, setNewExercise] = useState({
    title: '',
    muscleGroup: '',
    equipment: '',
    description: '',
    instructions: '',
  });

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
    setNewExercise({
      title: '',
      muscleGroup: '',
      equipment: '',
      description: '',
      instructions: '',
    });
    setFile(null);
  };

  const addExercise = async () => {
    if (!newExercise.title.trim() || !newExercise.muscleGroup.trim()) {
      setStatus('عنوان و گروه عضلانی الزامی است.');
      return;
    }
    setSaving(true);
    setStatus('');
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
      setStatus('حرکت با موفقیت ذخیره شد.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ذخیره حرکت ناموفق بود.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="کتابخانه حرکات"
        description="حرکات را یک‌بار تعریف کن و در برنامه‌های مختلف دوباره استفاده کن."
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> حرکت جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>تعریف حرکت تمرینی</DialogTitle>
                <DialogDescription>
                  عنوان، توضیحات اجرای صحیح و فایل آموزشی حرکت را ثبت کن.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-bold">عنوان حرکت</span>
                  <Input
                    value={newExercise.title}
                    onChange={(event) =>
                      setNewExercise({ ...newExercise, title: event.target.value })
                    }
                    placeholder="مثلاً پرس سینه دمبل"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">گروه عضلانی</span>
                  <Input
                    value={newExercise.muscleGroup}
                    onChange={(event) =>
                      setNewExercise({ ...newExercise, muscleGroup: event.target.value })
                    }
                    placeholder="سینه"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">تجهیزات</span>
                  <Input
                    value={newExercise.equipment}
                    onChange={(event) =>
                      setNewExercise({ ...newExercise, equipment: event.target.value })
                    }
                    placeholder="دمبل و نیمکت"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-bold">توضیح کوتاه</span>
                  <Textarea
                    value={newExercise.description}
                    onChange={(event) =>
                      setNewExercise({ ...newExercise, description: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-bold">نحوه اجرای صحیح</span>
                  <Textarea
                    value={newExercise.instructions}
                    onChange={(event) =>
                      setNewExercise({ ...newExercise, instructions: event.target.value })
                    }
                  />
                </label>
                <div className="sm:col-span-2">
                  <div className="rounded-2xl border-2 border-dashed bg-slate-50 p-6 text-center">
                    <Upload className="mx-auto size-7 text-teal-700" />
                    <p className="mt-3 text-sm font-bold">تصویر یا ویدیوی آموزشی را انتخاب کن</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG، PNG، WebP، MP4 یا WebM تا ۱۰۰ مگابایت
                    </p>
                    <Input
                      className="mx-auto mt-4 max-w-sm bg-white"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>
              {status && (
                <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">{status}</p>
              )}
              <Button className="mt-5 w-full" disabled={saving} onClick={() => void addExercise()}>
                {saving ? 'در حال ذخیره...' : 'ذخیره حرکت'}
              </Button>
            </DialogContent>
          </Dialog>
        }
      />

      {exercisesQuery.isError && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {exercisesQuery.error.message}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border bg-white px-3 shadow-sm">
          <Search className="size-4 text-muted-foreground" />
          <Input
            className="border-0 px-0 focus:ring-0"
            placeholder="جستجوی حرکت..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
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
              <img
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
        <div className="rounded-2xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground">
          حرکتی پیدا نشد.
        </div>
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
              <img
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
