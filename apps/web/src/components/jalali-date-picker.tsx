import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, dateFromApiValue, dateToApiValue, formatFaDate } from '@/lib/utils';

type JalaliDatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function JalaliDatePicker({
  id,
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled,
  required,
  className,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = dateFromApiValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!selected}
          aria-required={required}
          disabled={disabled}
          className={cn(
            'w-full justify-start text-start data-[empty=true]:text-muted-foreground',
            className,
          )}
        >
          <CalendarDays data-icon="inline-start" />
          {selected ? formatFaDate(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(dateToApiValue(date));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
