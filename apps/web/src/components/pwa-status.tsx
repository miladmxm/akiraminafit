import { useEffect, useState } from 'react';
import { Download, RefreshCcw, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaStatus() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xl lg:bottom-5">
        <WifiOff className="size-4" /> حالت آفلاین
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-2xl lg:bottom-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <RefreshCcw className="size-4 text-primary" /> نسخه جدید آماده است
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={() => void updateServiceWorker(true)}>
            به‌روزرسانی
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setNeedRefresh(false)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (installPrompt) {
    return (
      <Button
        className="mb-5"
        size="sm"
        onClick={async () => {
          await installPrompt.prompt();
          await installPrompt.userChoice;
          setInstallPrompt(null);
        }}
      >
        <Download data-icon="inline-start" /> نصب اپ
      </Button>
    );
  }

  return null;
}
