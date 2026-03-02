import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect('/app');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between p-6">
      <section className="space-y-4 pt-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-masters-green">GolfBuddy</p>
        <h1 className="text-4xl font-bold leading-tight">Live Stableford competitions, done beautifully.</h1>
        <p className="text-slate-600">Create comps, track hole-by-hole scores, and follow real-time leaderboards.</p>
      </section>
      <section className="space-y-3 pb-10">
        <Button asChild className="w-full"><Link href="/auth">Get started with magic link</Link></Button>
      </section>
    </main>
  );
}
