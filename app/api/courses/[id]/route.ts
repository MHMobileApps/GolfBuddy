import { NextResponse } from 'next/server';
import { golfCourseApi } from '@/lib/golf/course-api';
import { normalizeCourse } from '@/lib/golf/normalize';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const data = await golfCourseApi.course(params.id);
  return NextResponse.json(normalizeCourse(data));
}
