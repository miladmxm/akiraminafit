import type { ComponentProps } from 'react';

const FALLBACK_SRC = '/pwa-512x512.png';

export function ExerciseImage({ onError, ...props }: ComponentProps<'img'>) {
  return (
    <img
      {...props}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(FALLBACK_SRC)) {
          event.currentTarget.src = FALLBACK_SRC;
        }
        onError?.(event);
      }}
    />
  );
}
