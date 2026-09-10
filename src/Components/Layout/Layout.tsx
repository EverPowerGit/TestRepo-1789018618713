import { Outlet, Link, useLocation } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-gray-50 to-white">
      <header className="sticky top-0 z-40 border-b border-indigo-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BadgeCheck className="h-5 w-5" />
            </span>
            EverVote
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                location.pathname === '/' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              Voting
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-100 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} EverVote. All rights reserved.
      </footer>
    </div>
  );
}
