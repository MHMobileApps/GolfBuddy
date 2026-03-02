import { env } from '@/lib/env';
import { getCached, setCached } from '@/lib/cache/memory';

const BASE_URL = 'https://api.golfcourseapi.com/v1/';
const TTL = 1000 * 60 * 15;

function getApiKey() {
  return process.env.GOLFCOURSE_API_KEY ?? env.golfCourseApiKey;
}

async function fetchApi(path: string) {
  const cacheKey = path;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const url = `${BASE_URL}${path.replace(/^\//, '')}`;

  console.log('[GolfCourseAPI] GOLFCOURSE_API_KEY present:', Boolean(apiKey));
  console.log('[GolfCourseAPI] Upstream URL:', url);

  const res = await fetch(url, {
    headers: { Authorization: `Key ${apiKey}` },
    cache: 'no-store'
  });

  console.log('[GolfCourseAPI] Upstream response status:', res.status);

  if (!res.ok) {
    const bodySnippet = (await res.text()).slice(0, 300);
    throw new Error(`GolfCourseAPI request failed with status ${res.status}: ${bodySnippet}`);
  }

  const data = await res.json();
  setCached(cacheKey, data, TTL);
  return data;
}

function normalizeCoursesResponse(data: unknown) {
  const payload = data as { courses?: unknown; results?: unknown };

  if (Array.isArray(payload.courses)) return { courses: payload.courses };
  if (Array.isArray(payload.results)) return { courses: payload.results };

  throw new Error('GolfCourseAPI returned an unexpected response shape for course list');
}

export const golfCourseApi = {
  search: async (q: string) => {
    const data = await fetchApi(`/search?query=${encodeURIComponent(q)}`);
    return normalizeCoursesResponse(data);
  },
  nearby: async (lat: number, lng: number, radiusKm = 30) => {
    const data = await fetchApi(`/search?latitude=${lat}&longitude=${lng}&radius=${radiusKm}`);
    return normalizeCoursesResponse(data);
  },
  course: (id: string) => fetchApi(`/courses/${id}`)
};
