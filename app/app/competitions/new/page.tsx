'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function NewCompetitionPage() {
  const [name, setName] = useState('Saturday Stableford');
  const [allowance, setAllowance] = useState('1');
  const [courseId, setCourseId] = useState('');
  const [teeId, setTeeId] = useState('');
  const router = useRouter();

  async function createCompetition() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data } = await supabase
      .from('competitions')
      .insert({
        owner_user_id: auth.user.id,
        course_id: courseId,
        tee_id: teeId,
        allowance_multiplier: Number(allowance),
        competition_type: 'individual_stableford',
        name,
        starts_at: new Date().toISOString(),
        status: 'scheduled'
      })
      .select('id')
      .single();

    if (data?.id) router.push(`/app/competitions/${data.id}`);
  }

  return (
    <main>
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">Create competition</h1>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Competition name" />
        <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Course ID" />
        <Input value={teeId} onChange={(e) => setTeeId(e.target.value)} placeholder="Tee ID" />
        <select value={allowance} onChange={(e) => setAllowance(e.target.value)} className="w-full rounded-xl border p-2">
          <option value="1">100%</option>
          <option value="0.95">95%</option>
          <option value="0.9">90%</option>
        </select>
        <Button onClick={createCompetition}>Create</Button>
      </Card>
    </main>
  );
}
