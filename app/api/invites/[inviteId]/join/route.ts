import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_: Request, { params }: { params: { inviteId: string } }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: invite } = await supabase
    .from('invites')
    .select('competition_id, email')
    .eq('id', params.inviteId)
    .single();

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

  await supabase.from('invites').update({ accepted_user_id: auth.user.id }).eq('id', params.inviteId);
  await supabase.from('competition_players').insert({
    competition_id: invite.competition_id,
    user_id: auth.user.id
  });

  return NextResponse.json({ success: true, competitionId: invite.competition_id });
}
