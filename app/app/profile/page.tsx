'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [handicap, setHandicap] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', data.user.id).maybeSingle();
      if (profile) {
        setDisplayName(profile.display_name ?? '');
        setHandicap(profile.handicap_index?.toString() ?? '');
      }
    });
  }, []);

  async function saveProfile() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('profiles').upsert({
      user_id: data.user.id,
      display_name: displayName,
      handicap_index: handicap ? Number(handicap) : null
    });
  }

  return (
    <main>
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">Profile</h1>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
        <Input value={handicap} onChange={(e) => setHandicap(e.target.value)} placeholder="WHS Handicap Index (optional)" />
        <Button onClick={saveProfile}>Save profile</Button>
      </Card>
    </main>
  );
}
