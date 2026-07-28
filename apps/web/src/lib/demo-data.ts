export type DemoStudent = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  goal: string;
  adherence: number;
  lastWorkout: string;
  weight: number;
  trend: number;
};

export type DemoExercise = {
  id: string;
  title: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'مبتدی' | 'متوسط' | 'پیشرفته';
  description: string;
  instructions: string;
  image: string;
  video?: string;
};

export type DemoWorkoutItem = {
  id: string;
  title: string;
  description: string;
  sets: number;
  reps: string;
  rest: number;
  weight: number;
  muscleGroup: string;
  image: string;
};

export const demoStudents: DemoStudent[] = [
  {
    id: 'student-1',
    name: 'نیما احمدی',
    email: 'student@example.com',
    avatar: 'ن‌ا',
    goal: 'کاهش چربی و افزایش قدرت',
    adherence: 88,
    lastWorkout: 'امروز، ۰۸:۴۵',
    weight: 79.2,
    trend: -1.8,
  },
  {
    id: 'student-2',
    name: 'سارا محمدی',
    email: 'sara@example.com',
    avatar: 'س‌م',
    goal: 'افزایش حجم عضلانی',
    adherence: 76,
    lastWorkout: 'دیروز، ۱۸:۲۰',
    weight: 62.4,
    trend: 0.9,
  },
  {
    id: 'student-3',
    name: 'امیرحسین کریمی',
    email: 'amir@example.com',
    avatar: 'ا‌ک',
    goal: 'آمادگی جسمانی عمومی',
    adherence: 64,
    lastWorkout: '۳ روز قبل',
    weight: 86.1,
    trend: -0.4,
  },
  {
    id: 'student-4',
    name: 'هستی مرادی',
    email: 'hasti@example.com',
    avatar: 'ه‌م',
    goal: 'قدرت پایین‌تنه',
    adherence: 93,
    lastWorkout: 'امروز، ۰۷:۱۰',
    weight: 58.7,
    trend: 0.3,
  },
];

export const demoExercises: DemoExercise[] = [
  {
    id: 'ex-1',
    title: 'پرس سینه دمبل',
    muscleGroup: 'سینه',
    equipment: 'دمبل و نیمکت',
    difficulty: 'متوسط',
    description: 'حرکت اصلی برای تقویت عضلات سینه، سرشانه جلویی و پشت بازو.',
    instructions:
      'کتف‌ها را جمع و روی نیمکت ثابت نگه دارید. دمبل‌ها را کنترل‌شده تا کنار سینه پایین بیاورید و بدون قفل‌کردن آرنج بالا ببرید.',
    image:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ex-2',
    title: 'اسکوات جام',
    muscleGroup: 'پا',
    equipment: 'دمبل',
    difficulty: 'مبتدی',
    description: 'حرکت چندمفصلی برای چهارسر ران، باسن و عضلات مرکزی.',
    instructions:
      'دمبل را نزدیک سینه نگه دارید. زانوها هم‌جهت پنجه‌ها حرکت کنند و در تمام دامنه ستون فقرات خنثی بماند.',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ex-3',
    title: 'قایقی سیم‌کش',
    muscleGroup: 'پشت',
    equipment: 'سیم‌کش',
    difficulty: 'مبتدی',
    description: 'حرکت کنترل‌شده برای عضلات میانی پشت و جمع‌کردن کتف‌ها.',
    instructions:
      'قفسه سینه را بالا نگه دارید و بدون تاب‌دادن تنه، دستگیره را به سمت پایین سینه بکشید.',
    image:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ex-4',
    title: 'پلانک ساعد',
    muscleGroup: 'مرکزی',
    equipment: 'بدون وسیله',
    difficulty: 'مبتدی',
    description: 'تمرین ایزومتریک برای ثبات ستون فقرات و عضلات مرکزی.',
    instructions: 'بدن از سر تا پاشنه در یک خط بماند، شکم منقبض و لگن بدون افت یا بالا رفتن باشد.',
    image:
      'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ex-5',
    title: 'ددلیفت رومانیایی',
    muscleGroup: 'همسترینگ',
    equipment: 'هالتر',
    difficulty: 'پیشرفته',
    description: 'حرکت هیپ‌هینج برای همسترینگ، باسن و عضلات پشت.',
    instructions:
      'هالتر نزدیک بدن حرکت کند. لگن را عقب ببرید و با حفظ کمر خنثی تا کشش مناسب همسترینگ پایین بروید.',
    image:
      'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ex-6',
    title: 'پرس سرشانه نشسته',
    muscleGroup: 'سرشانه',
    equipment: 'دمبل',
    difficulty: 'متوسط',
    description: 'تقویت دلتوئید و کنترل بالاتنه در وضعیت نشسته.',
    instructions:
      'شکم را منقبض نگه دارید، دمبل‌ها را از کنار گوش بالا ببرید و از قوس زیاد کمر جلوگیری کنید.',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  },
];

export const todayWorkout: DemoWorkoutItem[] = [
  {
    id: 'work-1',
    title: 'پرس سینه دمبل',
    description: 'تکرارها را با مکث کوتاه پایین حرکت انجام بده.',
    sets: 4,
    reps: '۸ تا ۱۰',
    rest: 90,
    weight: 16,
    muscleGroup: 'سینه',
    image: demoExercises[0]!.image,
  },
  {
    id: 'work-2',
    title: 'اسکوات جام',
    description: 'عمق حرکت تا جایی باشد که فرم کمر حفظ شود.',
    sets: 3,
    reps: '۱۲',
    rest: 75,
    weight: 18,
    muscleGroup: 'پا',
    image: demoExercises[1]!.image,
  },
  {
    id: 'work-3',
    title: 'قایقی سیم‌کش',
    description: 'در انتهای حرکت کتف‌ها را یک ثانیه جمع کن.',
    sets: 3,
    reps: '۱۲',
    rest: 60,
    weight: 32,
    muscleGroup: 'پشت',
    image: demoExercises[2]!.image,
  },
  {
    id: 'work-4',
    title: 'پلانک ساعد',
    description: 'تنفس طبیعی و بدن کاملاً در یک راستا.',
    sets: 3,
    reps: '۴۵ ثانیه',
    rest: 45,
    weight: 0,
    muscleGroup: 'مرکزی',
    image: demoExercises[3]!.image,
  },
];

export const bodyProgress = [
  { date: 'فروردین', weight: 84, fat: 23, muscle: 58, waist: 96 },
  { date: 'اردیبهشت', weight: 82.8, fat: 22.1, muscle: 58.4, waist: 94.8 },
  { date: 'خرداد', weight: 81.6, fat: 21.3, muscle: 58.7, waist: 93.1 },
  { date: 'تیر', weight: 80.4, fat: 20.4, muscle: 59.1, waist: 91.7 },
  { date: 'مرداد', weight: 79.2, fat: 19.8, muscle: 59.4, waist: 90.4 },
];

export const weeklyAdherence = [
  { day: 'شنبه', value: 100 },
  { day: 'یکشنبه', value: 0 },
  { day: 'دوشنبه', value: 100 },
  { day: 'سه‌شنبه', value: 100 },
  { day: 'چهارشنبه', value: 0 },
  { day: 'پنجشنبه', value: 75 },
  { day: 'جمعه', value: 0 },
];
