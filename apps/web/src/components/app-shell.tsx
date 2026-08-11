import type { UserRole } from '@fitflow/contracts';
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  ChevronLeft,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { PwaStatus } from '@/components/pwa-status';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { setStoredRole } from '@/lib/session-store';

const coachNav = [
  { href: '/coach', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { href: '/coach/students', label: 'شاگردان', icon: Users, end: false },
  { href: '/coach/exercises', label: 'حرکات', icon: Dumbbell, end: false },
  { href: '/coach/plans/new', label: 'برنامه‌ساز', icon: ClipboardList, end: false },
  { href: '/coach/reports', label: 'گزارش‌ها', icon: BarChart3, end: false },
];

const studentNav = [
  { href: '/student', label: 'تمرین امروز', icon: CalendarCheck2, end: true },
  { href: '/student/progress', label: 'پیشرفت', icon: Activity, end: false },
  { href: '/student/plans', label: 'برنامه من', icon: BookOpen, end: false },
];

export function AppShell({ role }: { role: UserRole }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nav = role === 'coach' ? coachNav : studentNav;
  const user =
    role === 'coach'
      ? { name: 'آرش رضایی', role: 'مربی', initials: 'آ‌ر' }
      : { name: 'نیما احمدی', role: 'شاگرد', initials: 'ن‌ا' };

  const logout = async () => {
    await authClient.signOut().catch(() => undefined);
    setStoredRole(null);
    void navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 border-e bg-white/90 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Logo />
        <nav className="mt-9 flex flex-1 flex-col gap-1.5">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950',
                  isActive && 'bg-teal-50 text-teal-800 hover:bg-teal-50 hover:text-teal-800',
                )
              }
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
              <ChevronLeft className="ms-auto size-4 opacity-40" />
            </NavLink>
          ))}
        </nav>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-xs font-black text-white">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.role}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="خروج">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 lg:hidden">
        <Logo compact />
        <div className="flex items-center gap-2">
          <div className="text-end">
            <div className="text-xs font-bold">{user.name}</div>
            <div className="text-[10px] text-muted-foreground">{user.role}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenu(true)}>
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileMenu(false)}
            aria-label="بستن منو"
          />
          <aside className="absolute inset-y-0 start-0 w-[82%] max-w-sm bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenu(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <nav className="mt-8 flex flex-col gap-2">
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  onClick={() => setMobileMenu(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 font-semibold',
                      isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600',
                    )
                  }
                >
                  <item.icon className="size-5" /> {item.label}
                </NavLink>
              ))}
            </nav>
            <Button className="absolute bottom-6 inset-x-5" variant="outline" onClick={logout}>
              <LogOut className="size-4" /> خروج از حساب
            </Button>
          </aside>
        </div>
      )}

      <main className="min-h-screen pb-24 lg:ms-72 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PwaStatus />
          <div key={location.pathname}>
            <Outlet />
          </div>
        </div>
      </main>

      <nav
        className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 grid border-t px-2 pt-2 lg:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold text-slate-500',
                isActive && 'bg-teal-50 text-teal-800',
              )
            }
          >
            <item.icon className="size-5" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
