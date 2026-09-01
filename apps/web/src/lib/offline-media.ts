export const TRAINING_MEDIA_CACHE = 'akiraminafit-training-media-v1';

export type OfflineMediaProgress = {
  completed: number;
  total: number;
  downloadedBytes: number;
};

function uniqueHttpUrls(urls: string[]) {
  return [...new Set(urls.filter((url) => /^https?:\/\//i.test(url)))];
}

export async function getOfflineMediaStatus(urls: string[]) {
  const uniqueUrls = uniqueHttpUrls(urls);
  const cache = await caches.open(TRAINING_MEDIA_CACHE);
  const cached = await Promise.all(uniqueUrls.map((url) => cache.match(url)));

  return {
    total: uniqueUrls.length,
    downloaded: cached.filter(Boolean).length,
  };
}

export async function downloadOfflineMedia(
  urls: string[],
  onProgress?: (progress: OfflineMediaProgress) => void,
) {
  const uniqueUrls = uniqueHttpUrls(urls);
  const cache = await caches.open(TRAINING_MEDIA_CACHE);
  let completed = 0;
  let downloadedBytes = 0;

  for (const url of uniqueUrls) {
    const existing = await cache.match(url);
    if (!existing) {
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok || response.status !== 200) {
        throw new Error('دریافت کامل یکی از فایل‌های آموزشی ناموفق بود.');
      }

      const contentLength = Number(response.headers.get('content-length') ?? 0);
      await cache.put(url, response);
      downloadedBytes += Number.isFinite(contentLength) ? contentLength : 0;
    }
    completed += 1;
    onProgress?.({ completed, total: uniqueUrls.length, downloadedBytes });
  }

  // Browsers may still evict data under storage pressure, but this asks for the
  // strongest available persistence after the user explicitly downloads media.
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      await navigator.storage.persist();
    } catch {
      // Media is already cached; persistence is a best-effort browser feature.
    }
  }

  return getOfflineMediaStatus(uniqueUrls);
}

export async function removeOfflineMedia(urls: string[]) {
  const cache = await caches.open(TRAINING_MEDIA_CACHE);
  const uniqueUrls = uniqueHttpUrls(urls);
  await Promise.all(uniqueUrls.map((url) => cache.delete(url)));
}
