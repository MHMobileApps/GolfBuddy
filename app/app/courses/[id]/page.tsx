'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/courses/${params.id}`).then((r) => r.json()).then(setCourse);
  }, [params.id]);

  if (!course) return <p>Loading...</p>;

  return (
    <main className="space-y-3">
      <Card>
        <h1 className="text-xl font-bold">{course.course.name}</h1>
        <p className="text-sm text-slate-500">Select a default tee or use for next competition.</p>
      </Card>
      {(course.tees ?? []).map((tee: any) => (
        <Card key={tee.tee_id} className="space-y-2">
          <p className="font-semibold">{tee.tee_name} ({tee.gender || 'unisex'})</p>
          <p className="text-sm">Slope {tee.slope} · Rating {tee.rating} · Par {tee.par_total}</p>
          <Button variant="outline">Set as Home Tee</Button>
        </Card>
      ))}
    </main>
  );
}
