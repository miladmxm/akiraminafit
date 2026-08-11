import { cn } from '@/lib/utils';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-logo-surface p-1 shadow-sm">
        <img src="/logo.svg" alt="لوگوی AkiraminaFit" className="size-full object-contain" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-lg font-black tracking-tight" dir="ltr">
            AkiraminaFit
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">مدیریت هوشمند تمرین</div>
        </div>
      )}
    </div>
  );
}
