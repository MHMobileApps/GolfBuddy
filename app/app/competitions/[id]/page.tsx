'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { allocateStrokesByHole, stablefordPoints } from '@/lib/golf/handicap';

export default function CompetitionPage({ params }: { params: { id: string } }) {
  const [hole, setHole] = useState(1);
  const [gross, setGross] = useState('4');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const strokeAllocation = useMemo(() => allocateStrokesByHole(12, Array.from({ length: 18 }, (_, i) => i + 1)), []);

  useEffect(() => {
    const supabase = createClient();
    fetch(`/api/competitions/${params.id}/leaderboard`).then((r) => r.json()).then((d) => setLeaderboard(d.rows || []));
    const channel = supabase
      .channel(`scores-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hole_scores', filter: `competition_id=eq.${params.id}` }, () => {
        fetch(`/api/competitions/${params.id}/leaderboard`).then((r) => r.json()).then((d) => setLeaderboard(d.rows || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  async function saveScore() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from('hole_scores').upsert({
      competition_id: params.id,
      user_id: auth.user.id,
      hole_number: hole,
      gross_strokes: Number(gross)
    });
  }

  const pointsPreview = stablefordPoints(4, Number(gross), strokeAllocation[hole - 1]);

  return (
    <main className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <div className="mt-2 space-y-2">
          {leaderboard.map((row, index) => (
            <div key={row.user_id} className="flex justify-between rounded-lg bg-slate-50 p-2 text-sm">
              <span>{index + 1}. {row.display_name}</span>
              <span>{row.points} pts · Thru {row.thru}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-semibold">Score Entry</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setHole(Math.max(1, hole - 1))}>-</Button>
          <p className="font-semibold">Hole {hole}</p>
          <Button variant="outline" onClick={() => setHole(Math.min(18, hole + 1))}>+</Button>
        </div>
        <Input value={gross} onChange={(e) => setGross(e.target.value)} inputMode="numeric" />
        <p className="text-sm text-slate-600">Strokes on hole: {strokeAllocation[hole - 1]} · Points preview: {pointsPreview}</p>
        <Button onClick={saveScore}>Save hole score</Button>
      </Card>
    </main>
  );
}
