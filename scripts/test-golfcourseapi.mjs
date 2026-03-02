const API_KEY = process.env.GOLFCOURSE_API_KEY;
const BASE_URL = 'https://api.golfcourseapi.com';

function safePreview(value, max = 500) {
  return String(value ?? '').slice(0, max);
}

function printCourseSummary(course, index) {
  const city = course?.location?.city ?? 'n/a';
  const country = course?.location?.country ?? 'n/a';
  console.log(
    `${index + 1}. id=${course?.id ?? 'n/a'} | club_name=${course?.club_name ?? 'n/a'} | course_name=${course?.course_name ?? 'n/a'} | city=${city} | country=${country}`
  );
}

async function callApi(url) {
  console.log(`\nURL: ${url}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Key ${API_KEY}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  console.log(`HTTP status: ${response.status}`);

  const responseText = await response.text();
  if (response.status !== 200) {
    console.error(`Non-200 response body (first 500 chars): ${safePreview(responseText)}`);
    process.exit(1);
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error(`Failed to parse JSON body: ${String(error)}`);
    console.error(`Body (first 500 chars): ${safePreview(responseText)}`);
    process.exit(1);
  }
}

async function main() {
  console.log('GolfCourseAPI test harness');
  console.log(`API key present: ${Boolean(API_KEY)}`);
  if (API_KEY) {
    console.log(`API key prefix: ${API_KEY.slice(0, 4)}***`);
  }

  if (!API_KEY) {
    console.error('Missing GOLFCOURSE_API_KEY');
    process.exit(1);
  }

  const searchUrl = `${BASE_URL}/v1/search?search_query=${encodeURIComponent('St Andrews')}`;
  const searchData = await callApi(searchUrl);
  const courses = Array.isArray(searchData?.courses) ? searchData.courses : [];

  console.log(`Search returned ${courses.length} course(s).`);
  console.log('First 2 results:');
  courses.slice(0, 2).forEach((course, index) => printCourseSummary(course, index));

  if (!courses.length || !courses[0]?.id) {
    console.log('No course results found; skipping detail endpoint check.');
    return;
  }

  const courseId = courses[0].id;
  const detailUrl = `${BASE_URL}/v1/courses/${encodeURIComponent(String(courseId))}`;
  const detailData = await callApi(detailUrl);

  const teeSets = Array.isArray(detailData?.tee_boxes) ? detailData.tee_boxes : [];
  const firstTee = teeSets[0] ?? null;
  const holesCount = Array.isArray(firstTee?.holes) ? firstTee.holes.length : 0;

  console.log(`Course detail tee sets: ${teeSets.length}`);
  console.log(`Course detail holes count (first tee): ${holesCount}`);
}

main().catch((error) => {
  console.error('Harness failed:', error);
  process.exit(1);
});
