import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { apiService } from '../services/api';

type ServerState = 'waking' | 'online' | 'offline';

const navItems = [
  { path: '/', label: 'Home', end: true },
  { path: '/persona', label: 'Portrait & voice' },
  { path: '/train', label: 'Add a memory' },
  { path: '/talk', label: 'Talk' },
  { path: '/memories', label: 'The album' },
];

const status: Record<ServerState, { dot: string; text: string }> = {
  waking: { dot: 'bg-tape animate-pulse', text: 'Opening the archive…' },
  online: { dot: 'bg-moss', text: 'The archive is open' },
  offline: { dot: 'bg-oxblood', text: 'Archive unreachable' },
};

const Layout: React.FC = () => {
  const [server, setServer] = useState<ServerState>('waking');

  // One ping on load wakes the sleeping Render backend before it's needed.
  useEffect(() => {
    apiService.ping().then((ok) => setServer(ok ? 'online' : 'offline'));
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Side column (a scrolling top bar on phones) */}
      <aside className="flex flex-col gap-6 border-b border-rule px-5 py-5 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:gap-10 md:border-b-0 md:border-r md:px-8 md:py-10">
        <Link to="/" className="flex flex-col gap-1">
          <span className="font-display text-3xl italic leading-none text-ink">SwarSmriti</span>
          <span className="text-[13px] text-ink-muted">a family's living archive</span>
        </Link>

        <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:flex-col md:gap-0.5">
          {navItems.map((item, i) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-baseline gap-3 whitespace-nowrap border-b-2 px-1 py-2.5 text-[15px] transition-colors md:py-3 ${
                  isActive ? 'border-oxblood font-bold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`font-display text-sm ${isActive ? 'text-oxblood' : 'text-ink-muted'}`}>0{i + 1}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden flex-col gap-6 md:mt-auto md:flex">
          <p className="font-display text-[15px] italic leading-relaxed text-ink-soft">“Some voices are too dear to lose.”</p>
          <p className="flex items-center gap-2 text-xs text-ink-muted" aria-live="polite">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status[server].dot}`} />
            {status[server].text}
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-10 md:py-14">
          {server === 'offline' && (
            <p role="alert" className="mb-8 rounded-lg border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood-deep">
              The archive can't be reached right now. Please check your connection and refresh in a minute.
            </p>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;