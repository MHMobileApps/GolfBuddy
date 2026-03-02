import { NextResponse } from 'next/server';
import { golfCourseApi } from '@/lib/golf/course-api';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const data = await golfCourseApi.search(q);
  return NextResponse.json(data);
}
