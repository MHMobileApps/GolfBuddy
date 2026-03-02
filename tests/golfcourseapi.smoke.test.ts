import { describe, expect, it } from 'vitest';

const apiKey = process.env.GOLFCOURSE_API_KEY;
const hasKey = Boolean(apiKey);

describe('GolfCourseAPI smoke test', () => {
  it.skipIf(!hasKey)('returns courses array from /v1/search', async () => {
    const response = await fetch(
      `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent('St Andrews')}`,
      {
        headers: {
          Authorization: `Key ${apiKey}`,
          Accept: 'application/json'
        },
        cache: 'no-store'
      }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.courses)).toBe(true);
  });
});
