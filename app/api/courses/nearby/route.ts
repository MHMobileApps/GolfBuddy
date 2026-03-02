import { NextResponse } from 'next/server';
import { golfCourseApi } from '@/lib/golf/course-api';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const radiusKm = Number(params.get('radiusKm') ?? '30');
  const data = await golfCourseApi.nearby(lat, lng, radiusKm);
  return NextResponse.json(data);
}
