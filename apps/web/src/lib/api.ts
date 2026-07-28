const API_URL = import.meta.env.VITE_API_URL ?? '';
export const apiUrl = (path: string) => `${API_URL}${path}`;
export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { demoRole?: 'coach' | 'student' } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (isDemoMode && options.demoRole) headers.set('X-Demo-Role', options.demoRole);

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: 'include',
  });
  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && data.message
        ? String(data.message)
        : 'خطا در ارتباط با سرور';
    throw new ApiError(message, response.status);
  }
  return data as T;
}
