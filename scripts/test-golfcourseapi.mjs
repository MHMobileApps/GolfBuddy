const API_KEY = process.env.GOLFCOURSE_API_KEY;
const BASE_URL = 'https://api.golfcourseapi.com';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_QUERY = 'St Andrews';
const DEFAULT_RADIUS_METERS = Number(process.env.GOLFAPI_NEARBY_RADIUS_METERS || 25_000);
const MAX_OSM_CANDIDATES = 10;
const USER_AGENT =
  process.env.OSM_USER_AGENT ||
  'GolfBuddy/0.1 (GolfCourseAPI harness; contact: local-dev@golfbuddy.example)';

function safePreview(value, max = 500) {
  return String(value ?? '').slice(0, max);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusM = 6_371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameClosenessScore(osmName, clubName, courseName) {
  const normOsm = normalizeName(osmName);
  const normClub = normalizeName(clubName);
  const normCourse = normalizeName(courseName);

  if (!normOsm) {
    return 0;
  }

  if (normOsm === normClub || normOsm === normCourse) {
    return 1;
  }

  const contains =
    (normClub && (normClub.includes(normOsm) || normOsm.includes(normClub))) ||
    (normCourse && (normCourse.includes(normOsm) || normOsm.includes(normCourse)));

  if (contains) {
    return 0.7;
  }

  const osmWords = normOsm.split(' ').filter(Boolean);
  const targetWords = `${normClub} ${normCourse}`.split(' ').filter(Boolean);

  if (!osmWords.length || !targetWords.length) {
    return 0;
  }

  const overlap = osmWords.filter((word) => targetWords.includes(word)).length;
  return overlap / Math.max(osmWords.length, 1) / 2;
}

function looksLikeUkPostcode(query) {
  return /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i.test(query.trim());
}

function isClearlyCourseOrClubQuery(query) {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return false;
  const courseHints = ['golf', 'club', 'course', 'links', 'country club'];
  return courseHints.some((hint) => lowered.includes(hint)) || lowered === DEFAULT_QUERY.toLowerCase();
}

function looksLikePlaceQuery(query) {
  const value = query.trim();
  if (!value) return false;
  if (looksLikeUkPostcode(value)) return true;
  if (isClearlyCourseOrClubQuery(value)) return false;

  const lowered = value.toLowerCase();
  const placeHints = ['town', 'city', 'village', 'road', 'street', 'uk', 'england', 'scotland'];
  if (placeHints.some((hint) => lowered.includes(hint))) return true;

  return value.split(/\s+/).length <= 2;
}

function getLatLonFromCourse(course) {
  const lat = Number(course?.location?.latitude ?? course?.location?.lat ?? course?.latitude ?? NaN);
  const lon = Number(course?.location?.longitude ?? course?.location?.lon ?? course?.longitude ?? NaN);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }
  return { lat, lon };
}

function printCourseSummary(course, index) {
  const city = course?.location?.city ?? 'n/a';
  const country = course?.location?.country ?? 'n/a';
  console.log(
    `${index + 1}. id=${course?.id ?? 'n/a'} | club_name=${course?.club_name ?? 'n/a'} | course_name=${course?.course_name ?? 'n/a'} | city=${city} | country=${country}`
  );
}

async function parseJsonOrThrow(response, bodyText, sourceName) {
  try {
    return JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`${sourceName} returned non-JSON body: ${String(error)}; body preview=${safePreview(bodyText)}`);
  }
}

async function httpRequest({ url, method = 'GET', headers = {}, body, sourceName }) {
  console.log(`\n[${sourceName}] ${method} ${url}`);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store'
    });
  } catch (error) {
    console.error(`[${sourceName}] request failed: ${String(error)}`);
    return null;
  }
  const responseText = await response.text();

  if (response.status !== 200) {
    console.error(`[${sourceName}] non-200 status: ${response.status}`);
    console.error(`[${sourceName}] body preview: ${safePreview(responseText)}`);
    return null;
  }

  return parseJsonOrThrow(response, responseText, sourceName);
}

async function golfApiSearch(searchQuery) {
  const url = `${BASE_URL}/v1/search?search_query=${encodeURIComponent(searchQuery)}`;
  return httpRequest({
    url,
    sourceName: 'GolfCourseAPI search',
    headers: {
      Authorization: `Key ${API_KEY}`,
      Accept: 'application/json'
    }
  });
}

async function golfApiCourseDetail(courseId) {
  const url = `${BASE_URL}/v1/courses/${encodeURIComponent(String(courseId))}`;
  return httpRequest({
    url,
    sourceName: 'GolfCourseAPI detail',
    headers: {
      Authorization: `Key ${API_KEY}`,
      Accept: 'application/json'
    }
  });
}

function countTeeTypes(teeBoxes) {
  const male = teeBoxes.filter((tee) => String(tee?.gender || '').toLowerCase() === 'm').length;
  const female = teeBoxes.filter((tee) => String(tee?.gender || '').toLowerCase() === 'f').length;
  return { male, female };
}

function firstTeeHolesByGender(teeBoxes, gender) {
  const tee = teeBoxes.find((item) => String(item?.gender || '').toLowerCase() === gender);
  return Array.isArray(tee?.holes) ? tee.holes.length : 0;
}

async function pickFirstCourseWithTees(courses) {
  for (const course of courses.slice(0, 10)) {
    if (!course?.id) continue;
    const detail = await golfApiCourseDetail(course.id);
    if (!detail) continue;

    const teeBoxes = Array.isArray(detail?.tee_boxes) ? detail.tee_boxes : [];
    const counts = countTeeTypes(teeBoxes);

    if (counts.male + counts.female > 0) {
      return { course, detail, teeBoxes, counts };
    }
  }

  return null;
}

async function geocodeWithNominatim(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const json = await httpRequest({
    url,
    sourceName: 'Nominatim geocode',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json'
    }
  });

  const first = Array.isArray(json) ? json[0] : null;
  if (!first?.lat || !first?.lon) {
    return null;
  }

  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name || query
  };
}

async function nearbyGolfCoursesFromOverpass(lat, lon, radiusMeters) {
  const query = `[out:json];\n(\n  node(around:${radiusMeters},${lat},${lon})["leisure"="golf_course"];\n  way(around:${radiusMeters},${lat},${lon})["leisure"="golf_course"];\n  relation(around:${radiusMeters},${lat},${lon})["leisure"="golf_course"];\n);\nout center tags;`;

  const json = await httpRequest({
    url: OVERPASS_URL,
    method: 'POST',
    sourceName: 'Overpass nearby',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'text/plain',
      Accept: 'application/json'
    },
    body: query
  });

  const elements = Array.isArray(json?.elements) ? json.elements : [];
  return elements
    .map((item) => {
      const name = item?.tags?.name;
      const centerLat = Number(item?.center?.lat ?? item?.lat ?? NaN);
      const centerLon = Number(item?.center?.lon ?? item?.lon ?? NaN);
      if (!name || Number.isNaN(centerLat) || Number.isNaN(centerLon)) {
        return null;
      }
      return { name, lat: centerLat, lon: centerLon };
    })
    .filter(Boolean);
}

function bestCourseMatchesForOsm(osmCourse, courses, topN = 3) {
  return courses
    .map((course) => {
      const coords = getLatLonFromCourse(course);
      const distance = coords
        ? haversineDistanceMeters(osmCourse.lat, osmCourse.lon, coords.lat, coords.lon)
        : Number.POSITIVE_INFINITY;
      const nameScore = nameClosenessScore(osmCourse.name, course?.club_name, course?.course_name);
      const score = nameScore * 100_000 - distance;
      return { course, distance, nameScore, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

async function runDirectNameSearch(query) {
  console.log(`\nUsing direct GolfCourseAPI name search for query: "${query}"`);
  const search = await golfApiSearch(query);
  const courses = Array.isArray(search?.courses) ? search.courses : [];

  console.log(`Search returned ${courses.length} course(s).`);
  courses.slice(0, 10).forEach((course, index) => printCourseSummary(course, index));

  if (!courses.length) {
    console.log('No results found.');
    return;
  }

  const picked = await pickFirstCourseWithTees(courses);
  if (!picked) {
    console.log('No courses with populated tees found in first 10 search results.');
    return;
  }

  const maleHoles = firstTeeHolesByGender(picked.teeBoxes, 'm');
  const femaleHoles = firstTeeHolesByGender(picked.teeBoxes, 'f');

  console.log(`\nSelected course id=${picked.course.id}`);
  console.log(`Tee sets: total=${picked.teeBoxes.length}, male=${picked.counts.male}, female=${picked.counts.female}`);
  console.log(`Holes in first male tee: ${maleHoles}`);
  console.log(`Holes in first female tee: ${femaleHoles}`);
}

async function runNearbyLookup(query, radiusMeters) {
  console.log(`\nUsing place/postcode flow for query: "${query}"`);
  const geocode = await geocodeWithNominatim(query);
  if (!geocode) {
    console.log('Could not geocode the query; aborting nearby lookup.');
    return;
  }

  console.log(`Geocoded to lat=${geocode.lat}, lon=${geocode.lon} (${geocode.displayName})`);

  const nearby = await nearbyGolfCoursesFromOverpass(geocode.lat, geocode.lon, radiusMeters);

  if (!nearby.length) {
    console.log('No nearby OSM golf courses found.');
    return;
  }

  const deduped = Array.from(new Map(nearby.map((item) => [normalizeName(item.name), item])).values());
  const withDistance = deduped
    .map((item) => ({
      ...item,
      distanceMeters: haversineDistanceMeters(geocode.lat, geocode.lon, item.lat, item.lon)
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  console.log(`Found ${withDistance.length} nearby OSM golf course candidate(s):`);
  withDistance.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.name} (${(item.distanceMeters / 1000).toFixed(2)} km)`);
  });

  for (const osmCourse of withDistance.slice(0, MAX_OSM_CANDIDATES)) {
    console.log(`\nMapping OSM course: ${osmCourse.name}`);
    const search = await golfApiSearch(osmCourse.name);
    const courses = Array.isArray(search?.courses) ? search.courses : [];

    if (!courses.length) {
      console.log('No GolfCourseAPI match found.');
      continue;
    }

    const topMatches = bestCourseMatchesForOsm(osmCourse, courses, 3);
    if (!topMatches.length) {
      console.log('No GolfCourseAPI match found.');
      continue;
    }

    let foundWithTees = false;
    for (const [matchIdx, match] of topMatches.entries()) {
      console.log(
        `Candidate ${matchIdx + 1}: id=${match.course?.id} | club=${match.course?.club_name ?? 'n/a'} | course=${match.course?.course_name ?? 'n/a'} | distance=${Number.isFinite(match.distance) ? `${(match.distance / 1000).toFixed(2)} km` : 'unknown'} | nameScore=${match.nameScore.toFixed(2)}`
      );

      if (!match.course?.id) continue;
      const detail = await golfApiCourseDetail(match.course.id);
      if (!detail) continue;

      const teeBoxes = Array.isArray(detail?.tee_boxes) ? detail.tee_boxes : [];
      if (!teeBoxes.length) {
        continue;
      }

      const counts = countTeeTypes(teeBoxes);
      const maleHoles = firstTeeHolesByGender(teeBoxes, 'm');
      const femaleHoles = firstTeeHolesByGender(teeBoxes, 'f');

      console.log(`Selected GolfCourseAPI id=${match.course.id} for OSM "${osmCourse.name}"`);
      console.log(`Tee sets: total=${teeBoxes.length}, male=${counts.male}, female=${counts.female}`);
      console.log(`Holes in first male tee: ${maleHoles}`);
      console.log(`Holes in first female tee: ${femaleHoles}`);
      foundWithTees = true;
      break;
    }

    if (!foundWithTees) {
      console.log('No GolfCourseAPI match found with populated tees.');
    }
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let radiusMeters = DEFAULT_RADIUS_METERS;
  const queryParts = [];

  for (let i = 0; i < args.length; i += 1) {
    const value = args[i];
    if (value === '--radius-m' && args[i + 1]) {
      radiusMeters = Number(args[i + 1]);
      i += 1;
      continue;
    }

    queryParts.push(value);
  }

  return {
    query: queryParts.join(' ').trim() || DEFAULT_QUERY,
    radiusMeters: Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : DEFAULT_RADIUS_METERS
  };
}

async function main() {
  const { query, radiusMeters } = parseArgs(process.argv);
  console.log('GolfCourseAPI + OSM test harness');
  console.log(`API key present: ${Boolean(API_KEY)}`);

  if (!API_KEY) {
    console.error('Missing GOLFCOURSE_API_KEY');
    process.exit(1);
  }

  console.log(`Query: "${query}"`);
  console.log(`Nearby radius: ${radiusMeters} meters`);

  if (looksLikePlaceQuery(query)) {
    await runNearbyLookup(query, radiusMeters);
    return;
  }

  await runDirectNameSearch(query);
}

main().catch((error) => {
  console.error('Harness failed:', error);
  process.exit(1);
});
