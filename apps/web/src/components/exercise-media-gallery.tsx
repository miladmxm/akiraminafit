import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, Minimize2, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import type { ExerciseMediaItem } from '@/lib/exercise-media';
import { cn, formatFaNumber } from '@/lib/utils';

type ExerciseMediaGalleryProps = {
  items: ExerciseMediaItem[];
  title: string;
  className?: string;
  initialId?: string;
};

export function ExerciseMediaGallery({
  items,
  title,
  className,
  initialId,
}: ExerciseMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const active = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (!initialId) return;
    const initialIndex = items.findIndex((item) => item.id === initialId);
    if (initialIndex >= 0) setActiveIndex(initialIndex);
  }, [initialId, items]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === galleryRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const move = (direction: -1 | 1) => {
    if (items.length < 2) return;
    setActiveIndex((current) => (current + direction + items.length) % items.length);
  };

  const toggleFullscreen = async () => {
    if (!galleryRef.current) return;
    if (document.fullscreenElement === galleryRef.current) {
      await document.exitFullscreen();
      return;
    }
    await galleryRef.current.requestFullscreen();
  };

  if (!active) {
    return (
      <Empty className={cn('min-h-52 border', className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>فایل آموزشی ثبت نشده</EmptyTitle>
          <EmptyDescription>مربی هنوز تصویر یا ویدیویی برای این حرکت نگذاشته است.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      ref={galleryRef}
      tabIndex={0}
      aria-label={`گالری آموزشی ${title}`}
      className={cn('media-gallery flex flex-col gap-3 bg-background', className)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') move(1);
        if (event.key === 'ArrowRight') move(-1);
      }}
    >
      <div className="media-gallery-stage relative aspect-video min-h-0 overflow-hidden rounded-2xl bg-brand">
        {active.mediaType === 'video' ? (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            className="size-full object-contain"
            aria-label={`${title} - ویدیوی ${formatFaNumber(activeIndex + 1)}`}
          />
        ) : (
          <img
            key={active.id}
            src={active.url}
            alt={`${title} - تصویر ${formatFaNumber(activeIndex + 1)}`}
            className="size-full object-contain"
          />
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <Badge variant="secondary">
            {formatFaNumber(activeIndex + 1)} از {formatFaNumber(items.length)}
          </Badge>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'خروج از تمام‌صفحه' : 'نمایش تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>

        {items.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute start-3 top-1/2 -translate-y-1/2"
              onClick={() => move(-1)}
              aria-label="فایل قبلی"
            >
              <ChevronRight />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute end-3 top-1/2 -translate-y-1/2"
              onClick={() => move(1)}
              aria-label="فایل بعدی"
            >
              <ChevronLeft />
            </Button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="فایل‌های آموزشی">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition',
                index === activeIndex ? 'border-primary' : 'border-transparent opacity-70',
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`نمایش فایل ${formatFaNumber(index + 1)}`}
              aria-current={index === activeIndex}
            >
              {item.mediaType === 'image' ? (
                <img src={item.url} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-muted-foreground">
                  <Video className="size-5" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
