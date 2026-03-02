import Link from 'next/link';
import { Plus, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <main className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Create a new Stableford comp or jump back into live scoring.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button asChild><Link href="/app/competitions/new"><Plus className="mr-2 h-4 w-4" />New Comp</Link></Button>
          <Button variant="outline" asChild><Link href="/app/courses"><Trophy className="mr-2 h-4 w-4" />Find Course</Link></Button>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Recent competitions</h2>
        <p className="text-sm text-slate-500">No competitions yet. Create your first event now.</p>
      </Card>
    </main>
  );
}
