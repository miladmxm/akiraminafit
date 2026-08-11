import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <div className="text-8xl font-black text-primary">۴۰۴</div>
        <h1 className="mt-4 text-2xl font-black">این صفحه پیدا نشد</h1>
        <p className="mt-2 text-muted-foreground">
          آدرس واردشده معتبر نیست یا صفحه جابه‌جا شده است.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">
            <Home className="size-4" /> بازگشت به خانه
          </Link>
        </Button>
      </div>
    </main>
  );
}
