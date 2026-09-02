import { ImageIcon, Upload, Video, X } from 'lucide-react';
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { MuscleGroupCombobox } from '@/components/muscle-group-combobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EXERCISE_MEDIA_ACCEPT } from '@/lib/exercise-media';
import type { ExerciseFormValues } from '@/lib/form-schemas';

type ExerciseFormFieldsProps = {
  idPrefix: string;
  control: Control<ExerciseFormValues>;
  register: UseFormRegister<ExerciseFormValues>;
  setValue: UseFormSetValue<ExerciseFormValues>;
  errors: FieldErrors<ExerciseFormValues>;
  files: File[];
  muscleGroups: string[];
};

export function ExerciseFormFields({
  idPrefix,
  control,
  register,
  setValue,
  errors,
  files,
  muscleGroups,
}: ExerciseFormFieldsProps) {
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2" data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor={`${idPrefix}-title`}>عنوان حرکت</FieldLabel>
        <Input
          id={`${idPrefix}-title`}
          placeholder="مثلاً پرس سینه دمبل"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        <FieldError>{errors.title?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.muscleGroup)}>
        <FieldLabel htmlFor={`${idPrefix}-muscle`}>گروه عضلانی</FieldLabel>
        <Controller
          control={control}
          name="muscleGroup"
          render={({ field }) => (
            <MuscleGroupCombobox
              ref={field.ref}
              id={`${idPrefix}-muscle`}
              value={field.value}
              options={muscleGroups}
              invalid={Boolean(errors.muscleGroup)}
              onBlur={field.onBlur}
              onValueChange={field.onChange}
            />
          )}
        />
        <FieldDescription>
          از گروه‌های موجود انتخاب کن یا نام گروه جدید را بنویس و اضافه کن.
        </FieldDescription>
        <FieldError>{errors.muscleGroup?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.equipment)}>
        <FieldLabel htmlFor={`${idPrefix}-equipment`}>تجهیزات</FieldLabel>
        <Input
          id={`${idPrefix}-equipment`}
          placeholder="دمبل و نیمکت"
          aria-invalid={Boolean(errors.equipment)}
          {...register('equipment')}
        />
        <FieldError>{errors.equipment?.message}</FieldError>
      </Field>
      <Field className="sm:col-span-2" data-invalid={Boolean(errors.difficulty)}>
        <FieldLabel htmlFor={`${idPrefix}-difficulty`}>سطح سختی</FieldLabel>
        <Controller
          control={control}
          name="difficulty"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={`${idPrefix}-difficulty`}
                aria-invalid={Boolean(errors.difficulty)}
              >
                <SelectValue placeholder="سطح سختی را انتخاب کن" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="beginner">مبتدی</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">پیشرفته</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError>{errors.difficulty?.message}</FieldError>
      </Field>
      <Field className="sm:col-span-2" data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor={`${idPrefix}-description`}>توضیح کوتاه</FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="هدف حرکت و عضلات درگیر را کوتاه بنویس."
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </Field>
      <Field className="sm:col-span-2" data-invalid={Boolean(errors.instructions)}>
        <FieldLabel htmlFor={`${idPrefix}-instructions`}>نحوه اجرای صحیح</FieldLabel>
        <Textarea
          id={`${idPrefix}-instructions`}
          placeholder="مراحل اجرا و نکات ایمنی حرکت را بنویس."
          aria-invalid={Boolean(errors.instructions)}
          {...register('instructions')}
        />
        <FieldError>{errors.instructions?.message}</FieldError>
      </Field>
      <Field className="sm:col-span-2" data-invalid={Boolean(errors.files)}>
        <FieldLabel htmlFor={`${idPrefix}-files`}>فایل‌های آموزشی (اختیاری)</FieldLabel>
        <Controller
          control={control}
          name="files"
          render={({ field: { onChange, ref } }) => (
            <label
              htmlFor={`${idPrefix}-files`}
              className="relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed bg-muted/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-within:ring-2 focus-within:ring-primary/30"
            >
              <Upload className="size-7 text-primary" />
              <span className="text-sm font-bold">تصاویر و ویدیوها را همزمان انتخاب کن</span>
              {files.length > 0 && (
                <Badge variant="secondary">{files.length} فایل انتخاب شده</Badge>
              )}
              <input
                id={`${idPrefix}-files`}
                ref={ref}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                type="file"
                multiple
                accept={EXERCISE_MEDIA_ACCEPT}
                aria-invalid={Boolean(errors.files)}
                onChange={(event) => {
                  onChange([...files, ...Array.from(event.target.files ?? [])]);
                  event.target.value = '';
                }}
              />
            </label>
          )}
        />
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {files.map((file, index) => (
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
                      files.filter((_, itemIndex) => itemIndex !== index),
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
          JPG، PNG، WebP، MP4 یا WebM؛ حداکثر ۱۰ فایل و ۱۰۰ مگابایت برای هر فایل
        </FieldDescription>
        <FieldError>{errors.files?.message}</FieldError>
      </Field>
    </FieldGroup>
  );
}
