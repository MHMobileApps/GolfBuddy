'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CoursesPage() {
  const [q, setQ] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  async function search() {
    const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCourses(data.courses ?? data.results ?? []);
  }

  async function nearMe() {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const res = await fetch(`/api/courses/nearby?lat=${latitude}&lng=${longitude}&radiusKm=30`);
      const data = await res.json();
      setCourses(data.courses ?? data.results ?? []);
    });
  }

  return (
    <main className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">Find courses</h1>
        <div className="flex gap-2">
          <Input value={q} placeholder="Search by city, course, postcode" onChange={(e) => setQ(e.target.value)} />
          <Button onClick={search}><Search className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" className="w-full" onClick={nearMe}>Near me</Button>
      </Card>
      {courses.map((course) => (
        <Link key={course.id} href={`/app/courses/${course.id}`}>
          <Card className="mb-3">
            <p className="font-semibold">{course.course_name ?? course.name}</p>
            <p className="text-sm text-slate-600">{course.city}, {course.country}</p>
          </Card>
        </Link>
      ))}
    </main>
  );
}
