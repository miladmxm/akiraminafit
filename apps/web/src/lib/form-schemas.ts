import * as v from 'valibot';

const requiredText = (message: string) => v.pipe(v.string(), v.trim(), v.nonEmpty(message));

const optionalText = v.pipe(v.string(), v.trim());

const optionalNumberText = (minimum: number, maximum: number, message: string) =>
  v.pipe(
    v.string(),
    v.trim(),
    v.check((value) => {
      if (!value) return true;
      const number = Number(value);
      return Number.isFinite(number) && number >= minimum && number <= maximum;
    }, message),
  );

export const loginSchema = v.object({
  email: v.pipe(requiredText('ایمیل را وارد کن.'), v.email('یک ایمیل معتبر وارد کن.')),
  password: v.pipe(v.string(), v.nonEmpty('رمز عبور را وارد کن.')),
});

export type LoginFormValues = v.InferInput<typeof loginSchema>;

export const studentSchema = v.object({
  name: requiredText('نام و نام خانوادگی را وارد کن.'),
  email: v.pipe(requiredText('ایمیل ورود را وارد کن.'), v.email('یک ایمیل معتبر وارد کن.')),
  phone: requiredText('شماره موبایل را وارد کن.'),
  password: v.pipe(v.string(), v.minLength(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')),
  goal: requiredText('هدف تمرینی شاگرد را وارد کن.'),
  birthDate: optionalText,
  gender: v.union([v.literal(''), v.literal('male'), v.literal('female'), v.literal('other')]),
  heightCm: optionalNumberText(1, 300, 'قد باید بین ۱ تا ۳۰۰ سانتی‌متر باشد.'),
  initialWeightKg: optionalNumberText(1, 500, 'وزن باید بین ۱ تا ۵۰۰ کیلوگرم باشد.'),
  medicalNotes: optionalText,
});

export type StudentFormValues = v.InferInput<typeof studentSchema>;

const exerciseMediaTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

export const exerciseSchema = v.object({
  title: requiredText('عنوان حرکت را وارد کن.'),
  muscleGroup: requiredText('گروه عضلانی را وارد کن.'),
  equipment: optionalText,
  description: optionalText,
  instructions: optionalText,
  difficulty: v.union([v.literal('beginner'), v.literal('intermediate'), v.literal('advanced')]),
  files: v.pipe(
    v.array(v.instance(File, 'فایل انتخاب‌شده معتبر نیست.')),
    v.maxLength(10, 'در هر مرحله حداکثر ۱۰ فایل انتخاب کن.'),
    v.check(
      (files) => files.every((file) => exerciseMediaTypes.includes(file.type)),
      'فرمت فایل‌ها باید JPG، PNG، WebP، MP4 یا WebM باشد.',
    ),
    v.check(
      (files) => files.every((file) => file.size <= 100 * 1024 * 1024),
      'حجم هر فایل نباید بیشتر از ۱۰۰ مگابایت باشد.',
    ),
  ),
});

export type ExerciseFormValues = v.InferInput<typeof exerciseSchema>;

export const mediaUploadSchema = v.object({
  exerciseId: requiredText('حرکت مرتبط را انتخاب کن.'),
  files: v.pipe(exerciseSchema.entries.files, v.minLength(1, 'حداقل یک تصویر یا ویدیو انتخاب کن.')),
});

export type MediaUploadFormValues = v.InferInput<typeof mediaUploadSchema>;

export const reportSchema = v.object({
  studentId: requiredText('ابتدا شاگرد را انتخاب کن.'),
  recordedAt: requiredText('تاریخ گزارش را انتخاب کن.'),
  weightKg: optionalNumberText(1, 500, 'وزن باید بین ۱ تا ۵۰۰ کیلوگرم باشد.'),
  bodyFatPercent: optionalNumberText(0, 100, 'درصد چربی باید بین ۰ تا ۱۰۰ باشد.'),
  muscleMassKg: optionalNumberText(0, 500, 'توده عضلانی باید بین ۰ تا ۵۰۰ کیلوگرم باشد.'),
  waistCm: optionalNumberText(1, 300, 'دور کمر باید بین ۱ تا ۳۰۰ سانتی‌متر باشد.'),
  chestCm: optionalNumberText(1, 300, 'دور سینه باید بین ۱ تا ۳۰۰ سانتی‌متر باشد.'),
  armRightCm: optionalNumberText(1, 150, 'دور بازو باید بین ۱ تا ۱۵۰ سانتی‌متر باشد.'),
  notes: v.pipe(optionalText, v.maxLength(2000, 'یادداشت نباید بیشتر از ۲۰۰۰ کاراکتر باشد.')),
});

export type ReportFormValues = v.InferInput<typeof reportSchema>;

export const workoutNoteSchema = v.object({
  note: v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(2000, 'یادداشت نباید بیشتر از ۲۰۰۰ کاراکتر باشد.'),
  ),
});

export type WorkoutNoteFormValues = v.InferInput<typeof workoutNoteSchema>;

const planItemSchema = v.object({
  id: requiredText('شناسه حرکت نامعتبر است.'),
  exerciseId: requiredText('حرکت انتخاب‌شده نامعتبر است.'),
  sets: v.pipe(
    v.number('تعداد ست را وارد کن.'),
    v.integer('تعداد ست باید عدد صحیح باشد.'),
    v.minValue(1, 'حداقل یک ست لازم است.'),
    v.maxValue(100, 'تعداد ست نمی‌تواند بیشتر از ۱۰۰ باشد.'),
  ),
  reps: requiredText('تعداد تکرار را وارد کن.'),
  rest: v.pipe(
    v.number('زمان استراحت را وارد کن.'),
    v.integer('زمان استراحت باید عدد صحیح باشد.'),
    v.minValue(0, 'زمان استراحت نمی‌تواند منفی باشد.'),
    v.maxValue(3600, 'زمان استراحت نمی‌تواند بیشتر از یک ساعت باشد.'),
  ),
  weight: v.pipe(
    v.number('وزن هدف را وارد کن.'),
    v.minValue(0, 'وزن هدف نمی‌تواند منفی باشد.'),
    v.maxValue(1000, 'وزن هدف نمی‌تواند بیشتر از ۱۰۰۰ کیلوگرم باشد.'),
  ),
  notes: v.pipe(optionalText, v.maxLength(1000, 'یادداشت حرکت بیش از حد طولانی است.')),
});

const planDaySchema = v.object({
  id: requiredText('شناسه جلسه نامعتبر است.'),
  title: requiredText('عنوان جلسه را وارد کن.'),
  weekday: v.pipe(
    v.nullable(v.number()),
    v.check((value) => value !== null, 'روز هفته را انتخاب کن.'),
  ),
  items: v.pipe(v.array(planItemSchema), v.minLength(1, 'حداقل یک حرکت به این جلسه اضافه کن.')),
});

export const planSchema = v.object({
  studentId: requiredText('شاگرد را انتخاب کن.'),
  title: requiredText('عنوان برنامه را وارد کن.'),
  description: optionalText,
  startDate: requiredText('تاریخ شروع را انتخاب کن.'),
  days: v.pipe(
    v.array(planDaySchema),
    v.minLength(1, 'برنامه باید حداقل یک روز تمرینی داشته باشد.'),
    v.check(
      (days) => new Set(days.map((day) => day.weekday)).size === days.length,
      'برای دو جلسه نمی‌توان یک روز هفته یکسان انتخاب کرد.',
    ),
  ),
});

export type PlanFormValues = v.InferInput<typeof planSchema>;
