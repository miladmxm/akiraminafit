import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn, dateFromApiValue, dateToApiValue, formatFaDate } from '@/lib/utils';

type JalaliDatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  defaultMonth?: Date;
  startMonth?: Date;
  endMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
};

export function JalaliDatePicker({
  id,
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled,
  required,
  invalid,
  defaultMonth,
  startMonth,
  endMonth,
  minDate,
  maxDate,
  className,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = dateFromApiValue(value);
  const today = new Date();
  const calendarStart = startMonth ?? minDate ?? new Date(today.getFullYear() - 100, 0, 1, 12);
  const calendarEnd = endMonth ?? maxDate ?? new Date(today.getFullYear() + 10, 11, 31, 12);
  const isDateUnavailable = (date: Date) => {
    const dateValue = dateToApiValue(date);
    return Boolean(
      (minDate && dateValue < dateToApiValue(minDate)) ||
      (maxDate && dateValue > dateToApiValue(maxDate)),
    );
  };

  const selectDate = (date: Date) => {
    if (isDateUnavailable(date)) return;
    onChange(dateToApiValue(date));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!selected}
          aria-required={required}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            'w-full justify-start text-start aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-[empty=true]:text-muted-foreground',
            className,
          )}
        >
          <CalendarDays data-icon="inline-start" />
          {selected ? formatFaDate(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={8} sideOffset={8} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            selectDate(date);
          }}
          {...(selected || defaultMonth ? { defaultMonth: selected ?? defaultMonth } : {})}
          captionLayout="dropdown"
          startMonth={calendarStart}
          endMonth={calendarEnd}
          disabled={isDateUnavailable}
          className="w-80 max-w-full"
          autoFocus
        />
        <Separator />
        <div className="flex items-center justify-between gap-2 p-2">
          {!required && selected ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              پاک کردن
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="ms-auto"
            disabled={isDateUnavailable(today)}
            onClick={() => selectDate(today)}
          >
            امروز
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
