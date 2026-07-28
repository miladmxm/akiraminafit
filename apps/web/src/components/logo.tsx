import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-lg shadow-teal-900/15">
        <Dumbbell className="size-6" />
      </div>
      {!compact && (
        <div>
          <div className="text-lg font-black tracking-tight">فیت‌فلو</div>
          <div className="text-[11px] font-medium text-muted-foreground">مدیریت هوشمند تمرین</div>
        </div>
      )}
    </div>
  );
}
