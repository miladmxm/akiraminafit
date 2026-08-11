import type { ComponentProps } from 'react';

export const EXERCISE_PLACEHOLDER_SRC = '/exercise-placeholder.jpg';

export function ExerciseImage({ onError, ...props }: ComponentProps<'img'>) {
  return (
    <img
      {...props}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(EXERCISE_PLACEHOLDER_SRC)) {
          event.currentTarget.src = EXERCISE_PLACEHOLDER_SRC;
        }
        onError?.(event);
      }}
    />
  );
}
