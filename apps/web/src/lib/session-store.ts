import { useSyncExternalStore } from 'react';
import type { UserRole } from '@fitflow/contracts';

const KEY = 'akiraminafit-role';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getStoredRole(): UserRole | null {
  const value = localStorage.getItem(KEY);
  return value === 'coach' || value === 'student' ? value : null;
}

export function setStoredRole(role: UserRole | null) {
  if (getStoredRole() === role) return;
  if (role) localStorage.setItem(KEY, role);
  else localStorage.removeItem(KEY);
  emit();
}

export function useStoredRole() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      const handleStorage = (event: StorageEvent) => {
        if (event.storageArea === localStorage && event.key === KEY) listener();
      };
      window.addEventListener('storage', handleStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', handleStorage);
      };
    },
    getStoredRole,
    () => null,
  );
}
