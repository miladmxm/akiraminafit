import { Activity, CalendarCheck2, ClipboardList, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdherenceChart } from '@/components/adherence-chart';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { demoStudents } from '@/lib/demo-data';
import { formatFaNumber } from '@/lib/utils';

export function CoachDashboardPage() {
  return (
    <>
      <PageHeader
        title="سلام آرش، روزت پرانرژی!"
        description="وضعیت شاگردها، تمرین‌های امروز و آخرین تغییرات را یکجا دنبال کن."
        action={
          <Button asChild>
            <Link to="/coach/plans/new">
              <Plus className="size-4" /> برنامه جدید
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="شاگرد فعال"
          value="۲۴"
          caption="۲ نفر این ماه اضافه شده‌اند"
          icon={Users}
          trend={{ value: '۸٪', positive: true }}
        />
        <MetricCard
          label="تمرین امروز"
          value="۱۷"
          caption="۱۲ جلسه تکمیل شده"
          icon={CalendarCheck2}
          trend={{ value: '۷۱٪', positive: true }}
        />
        <MetricCard
          label="برنامه فعال"
          value="۱۹"
          caption="۴ برنامه نیاز به بازبینی"
          icon={ClipboardList}
        />
        <MetricCard
          label="میانگین پایبندی"
          value="۸۲٪"
          caption="نسبت به هفته قبل"
          icon={Activity}
          trend={{ value: '۵٪', positive: true }}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdherenceChart />
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>شاگردان نیازمند توجه</CardTitle>
              <CardDescription>براساس پایبندی و فاصله آخرین تمرین</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/coach/students">مشاهده همه</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoStudents.slice(1).map((student) => (
              <div key={student.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-black text-white">
                  {student.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{student.name}</p>
                    <span className="text-xs font-black text-slate-700">
                      {formatFaNumber(student.adherence)}٪
                    </span>
                  </div>
                  <Progress value={student.adherence} className="mt-2 h-1.5" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    آخرین تمرین: {student.lastWorkout}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>فعالیت‌های اخیر</CardTitle>
            <CardDescription>آخرین رویدادهای مهم شاگردها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              ['نیما احمدی تمرین امروز را تکمیل کرد.', '۸ دقیقه قبل', 'success'],
              ['گزارش جسمانی سارا محمدی ثبت شد.', '۳۵ دقیقه قبل', 'default'],
              ['امیرحسین کریمی تمرین دیروز را انجام نداد.', '۲ ساعت قبل', 'warning'],
              ['هستی مرادی وزن واقعی اسکوات را به ۲۴ کیلو رساند.', 'دیروز', 'secondary'],
            ].map(([text, time, variant]) => (
              <div key={text} className="flex items-start gap-3 border-b py-3 last:border-0">
                <div className="mt-1 size-2 rounded-full bg-teal-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-6">{text}</p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
                <Badge variant={variant as 'default'}>رویداد</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden bg-gradient-to-br from-teal-800 to-cyan-900 text-white">
          <CardContent className="flex h-full min-h-72 flex-col justify-between p-7">
            <div>
              <Badge className="bg-white/15 text-white">پیشنهاد امروز</Badge>
              <h2 className="mt-5 max-w-md text-2xl font-black leading-10">
                برنامه شاگردانی که بیش از ۸ هفته بدون تغییر مانده را بازبینی کن.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-teal-100">
                چهار برنامه فعال در بازه پیشنهادی بازبینی قرار دارند.
              </p>
            </div>
            <Button className="mt-6 w-fit bg-white text-teal-900 hover:bg-teal-50" asChild>
              <Link to="/coach/plans/new">رفتن به برنامه‌ساز</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
