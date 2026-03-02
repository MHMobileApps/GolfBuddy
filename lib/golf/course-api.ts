import { env } from '@/lib/env';
import { getCached, setCached } from '@/lib/cache/memory';

const BASE_URL = 'https://api.golfcourseapi.com/v1';
const TTL = 1000 * 60 * 15;

async function fetchApi(path: string) {
  const cacheKey = path;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Key ${env.golfCourseApiKey}` },
    next: { revalidate: 900 }
  });

  if (!res.ok) throw new Error('GolfCourseAPI request failed');
  const data = await res.json();
  setCached(cacheKey, data, TTL);
  return data;
}

export const golfCourseApi = {
  search: (q: string) => fetchApi(`/search?query=${encodeURIComponent(q)}`),
  nearby: (lat: number, lng: number, radiusKm = 30) =>
    fetchApi(`/search?latitude=${lat}&longitude=${lng}&radius=${radiusKm}`),
  course: (id: string) => fetchApi(`/courses/${id}`)
};
