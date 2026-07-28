import type { LucideIcon } from 'lucide-react';
import { ArrowDownLeft, ArrowUpLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  caption?: string | undefined;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean } | undefined;
  className?: string | undefined;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <Icon className="size-5" />
          </div>
        </div>
        {(caption || trend) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-bold',
                  trend.positive ? 'text-emerald-700' : 'text-rose-700',
                )}
              >
                {trend.positive ? (
                  <ArrowUpLeft className="size-3.5" />
                ) : (
                  <ArrowDownLeft className="size-3.5" />
                )}
                {trend.value}
              </span>
            )}
            {caption && <span className="text-muted-foreground">{caption}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
