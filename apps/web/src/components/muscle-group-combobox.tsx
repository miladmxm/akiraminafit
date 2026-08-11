import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { forwardRef, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type MuscleGroupComboboxProps = {
  id: string;
  value: string;
  options: string[];
  invalid?: boolean;
  onBlur?: () => void;
  onValueChange: (value: string) => void;
};

export const MuscleGroupCombobox = forwardRef<HTMLButtonElement, MuscleGroupComboboxProps>(
  ({ id, value, options, invalid = false, onBlur, onValueChange }, ref) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const newGroup = search.trim().replace(/\s+/g, ' ');
    const hasExactMatch = useMemo(
      () =>
        options.some(
          (option) => option.localeCompare(newGroup, 'fa', { sensitivity: 'base' }) === 0,
        ),
      [newGroup, options],
    );

    const selectGroup = (group: string) => {
      onValueChange(group);
      setSearch('');
      setOpen(false);
    };

    return (
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setSearch('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            className="w-full justify-between"
            onBlur={onBlur}
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {value || 'گروه عضلانی را انتخاب کن'}
            </span>
            <ChevronsUpDown data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="جست‌وجو یا نوشتن گروه جدید..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>نام گروه جدید را بنویس.</CommandEmpty>
              <CommandGroup heading="گروه‌های عضلانی">
                {options.map((option) => (
                  <CommandItem key={option} value={option} onSelect={() => selectGroup(option)}>
                    <Check className={cn(value === option ? 'opacity-100' : 'opacity-0')} />
                    {option}
                  </CommandItem>
                ))}
                {newGroup && !hasExactMatch && (
                  <CommandItem value={newGroup} onSelect={() => selectGroup(newGroup)}>
                    <Plus /> افزودن «{newGroup}»
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
MuscleGroupCombobox.displayName = 'MuscleGroupCombobox';
