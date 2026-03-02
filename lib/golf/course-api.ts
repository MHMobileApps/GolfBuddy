import { env } from '@/lib/env';
import { getCached, setCached } from '@/lib/cache/memory';

const BASE_URL = 'https://api.golfcourseapi.com/v1';
const TTL = 1000 * 60 * 15;

function getApiKey() {
  return env.golfCourseApiKey;
}

type FetchApiOptions = {
  cache?: boolean;
};

function logDebug(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

async function fetchApi(path: string, options: FetchApiOptions = {}) {
  const shouldUseCache = options.cache ?? true;
  const cacheKey = path;

  if (shouldUseCache) {
    const cached = getCached<unknown>(cacheKey);
    if (cached) return cached;
  }

  const apiKey = getApiKey();
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  logDebug('[GolfCourseAPI] GOLFCOURSE_API_KEY present:', Boolean(apiKey));
  logDebug('[GolfCourseAPI] Upstream URL:', url);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Key ${apiKey}`,
        Accept: 'application/json'
      },
      cache: shouldUseCache ? 'default' : 'no-store'
    });
  } catch (error) {
    throw new Error(
      `GolfCourseAPI request failed before response for ${url} (apiKeyPresent=${Boolean(apiKey)}): ${String(error)}`
    );
  }

  const responseText = await res.text();
  const bodySnippet = responseText.slice(0, 300);

  logDebug('[GolfCourseAPI] Upstream response status:', res.status);
  logDebug('[GolfCourseAPI] Upstream response body snippet:', bodySnippet);

  if (!res.ok) {
    throw new Error(`GolfCourseAPI request failed with status ${res.status}: ${bodySnippet}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`GolfCourseAPI returned invalid JSON with status ${res.status}: ${bodySnippet}`);
  }

  if (shouldUseCache) {
    const hasEmptyCourses =
      typeof data === 'object' &&
      data !== null &&
      'courses' in data &&
      Array.isArray((data as { courses?: unknown }).courses) &&
      ((data as { courses: unknown[] }).courses.length === 0);

    const hasEmptyResults =
      typeof data === 'object' &&
      data !== null &&
      'results' in data &&
      Array.isArray((data as { results?: unknown }).results) &&
      ((data as { results: unknown[] }).results.length === 0);

    if (!hasEmptyCourses && !hasEmptyResults) {
      setCached(cacheKey, data, TTL);
    }
  }

  return data;
}

function normalizeCoursesResponse(data: unknown) {
  const payload = data as { courses?: unknown; results?: unknown; data?: unknown };

  if (Array.isArray(payload.courses)) return { courses: payload.courses };
  if (Array.isArray(payload.results)) return { courses: payload.results };
  if (Array.isArray(payload.data)) return { courses: payload.data };

  throw new Error('GolfCourseAPI returned an unexpected response shape for course list');
}

export const golfCourseApi = {
  search: async (q: string) => {
    const data = await fetchApi(`/search?search_query=${encodeURIComponent(q)}`, { cache: false });
    return normalizeCoursesResponse(data);
  },
  nearby: async (lat: number, lng: number, radiusKm = 30) => {
    const data = await fetchApi(`/search?latitude=${lat}&longitude=${lng}&radius=${radiusKm}`);
    return normalizeCoursesResponse(data);
  },
  course: (id: string) => fetchApi(`/courses/${id}`)
};
