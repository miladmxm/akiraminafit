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
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} fontSize={11} />
              <Tooltip
                contentStyle={{ borderRadius: 14, direction: 'rtl' }}
                formatter={(value) => [
                  `${Array.isArray(value) ? value.join('–') : String(value ?? 0)}%`,
                  'تکمیل',
                ]}
              />
              <Bar dataKey="value" name="تکمیل" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
