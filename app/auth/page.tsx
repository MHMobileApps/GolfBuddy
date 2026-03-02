'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function sendLink() {
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${env.siteUrl}/auth/callback` }
    });
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="card space-y-4 p-6">
        <Mail className="text-masters-green" />
        <h1 className="text-2xl font-bold">Sign in with magic link</h1>
        <Input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={sendLink}>Send sign in link</Button>
        {sent && <p className="text-sm text-slate-600">Check your inbox for the link.</p>}
      </div>
    </main>
  );
}
