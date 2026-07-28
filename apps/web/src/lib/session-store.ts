import { useSyncExternalStore } from 'react';
import type { UserRole } from '@fitflow/contracts';

const KEY = 'fitflow-demo-role';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getStoredRole(): UserRole | null {
  const value = localStorage.getItem(KEY);
  return value === 'coach' || value === 'student' ? value : null;
}

export function setStoredRole(role: UserRole | null) {
  if (role) localStorage.setItem(KEY, role);
  else localStorage.removeItem(KEY);
  emit();
}

export function useStoredRole() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getStoredRole,
    () => null,
  );
}
