import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { weeklyAdherence } from '@/lib/demo-data';

export function AdherenceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>پایبندی هفتگی</CardTitle>
        <CardDescription>درصد تکمیل تمرین برنامه‌ریزی‌شده در هر روز</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyAdherence} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                fontSize={11}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                fontSize={11}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  direction: 'rtl',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(value) => [
                  `${Array.isArray(value) ? value.join('–') : String(value ?? 0)}%`,
                  'تکمیل',
                ]}
              />
              <Bar dataKey="value" name="تکمیل" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
