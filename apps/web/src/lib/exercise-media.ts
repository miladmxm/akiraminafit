import { apiFetch } from '@/lib/api';

export const EXERCISE_MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';

export type ExerciseMediaItem = {
  id: string;
  exerciseId?: string;
  mediaType: 'image' | 'video';
  url: string;
  storageKey?: string;
  mimeType?: string;
  fileSize?: number;
  sortOrder?: number;
};

export type ExerciseRecord = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  media: ExerciseMediaItem[];
};

export async function uploadExerciseMedia(exerciseId: string, files: File[]) {
  for (const file of files) {
    const presigned = await apiFetch<{
      data: { uploadUrl: string; storageKey: string; publicUrl: string };
    }>('/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        entityType: 'exercise',
        entityId: exerciseId,
      }),
    });

    const uploadResponse = await fetch(presigned.data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error(`آپلود ${file.name} ناموفق بود.`);

    await apiFetch('/api/uploads/exercise-media', {
      method: 'POST',
      body: JSON.stringify({
        exerciseId,
        storageKey: presigned.data.storageKey,
        url: presigned.data.publicUrl,
        mimeType: file.type,
        fileSize: file.size,
      }),
    });
  }
}
