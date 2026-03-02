import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md p-4">
      <header className="mb-4 flex items-center justify-between rounded-2xl bg-masters-green p-4 text-white shadow-soft">
        <p className="font-bold">GolfBuddy</p>
        <nav className="flex gap-3 text-sm">
          <Link href="/app">Home</Link>
          <Link href="/app/courses">Courses</Link>
          <Link href="/app/profile">Profile</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
