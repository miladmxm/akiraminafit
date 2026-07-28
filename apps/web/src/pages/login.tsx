import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Dumbbell, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { isDemoMode } from '@/lib/api';
import { setStoredRole } from '@/lib/session-store';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('coach@example.com');
  const [password, setPassword] = useState('Coach123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const enterDemo = (role: 'coach' | 'student') => {
    setStoredRole(role);
    void navigate(role === 'coach' ? '/coach' : '/student');
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'ورود ناموفق بود.');
      return;
    }
    const session = await authClient.getSession();
    const sessionUser = session.data?.user as { role?: string } | undefined;
    const role = sessionUser?.role === 'coach' ? 'coach' : 'student';
    setStoredRole(role);
    void navigate(role === 'coach' ? '/coach' : '/student');
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:p-8">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -start-32 -top-32 size-96 rounded-full bg-teal-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -end-32 size-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <Logo className="relative [&>div:first-child]:bg-white [&>div:first-child]:text-teal-800 [&>div:last-child>div:last-child]:text-slate-400" />
        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-teal-200">
            <Dumbbell className="size-4" /> تجربه تمرینی یکپارچه
          </div>
          <h1 className="text-4xl font-black leading-[1.4] tracking-tight xl:text-5xl">
            برنامه‌ریزی دقیق برای مربی؛ اجرای ساده برای شاگرد.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
            حرکات، برنامه‌ها، گزارش جسمانی و تمرین روزانه در یک اپلیکیشن سریع، راست‌چین و قابل نصب روی
            موبایل.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: 'دسترسی امن' },
            { icon: Smartphone, label: 'PWA و آفلاین' },
            { icon: CheckCircle2, label: 'پیگیری تمرین' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Icon className="mb-3 size-5 text-teal-300" />
              <div className="text-xs font-semibold text-slate-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md items-center justify-center lg:max-w-lg">
        <div className="w-full">
          <Logo className="mb-8 lg:hidden" />
          <Card className="border-white/70 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <CardHeader className="p-6 sm:p-8 sm:pb-5">
              <CardTitle className="text-2xl font-black">ورود به فیت‌فلو</CardTitle>
              <CardDescription>برای مدیریت یا اجرای برنامه تمرینی وارد حساب شوید.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
              <form className="space-y-4" onSubmit={login}>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">ایمیل</span>
                  <Input
                    dir="ltr"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">رمز عبور</span>
                  <Input
                    dir="ltr"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                </label>
                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}
                <Button className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      ورود <ArrowLeft className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {isDemoMode && (
                <div className="mt-6 border-t pt-6">
                  <p className="mb-3 text-center text-xs font-bold text-muted-foreground">
                    مشاهده فوری نسخه نمایشی
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => enterDemo('coach')}>
                      ورود مربی
                    </Button>
                    <Button variant="secondary" onClick={() => enterDemo('student')}>
                      ورود شاگرد
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
            با ورود، شرایط استفاده و سیاست حریم خصوصی سامانه را می‌پذیرید.
          </p>
        </div>
      </section>
    </main>
  );
}
