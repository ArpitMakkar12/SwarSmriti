import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { apiService } from '../services/api';
import { usePerson } from '../context/PersonContext';

type ServerState = 'waking' | 'online' | 'offline';

const navItems = [
  { path: '/', label: 'Home', end: true },
  { path: '/family', label: 'The family' },
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

const ADD = '__add';

/** "Remembering: Nani ▾" — switches the whole app to another person. */
const PersonSwitcher: React.FC = () => {
  const { people, current, select } = usePerson();
  const navigate = useNavigate();

  if (people.length === 0) {
    return (
      <Link to="/family" className="flex flex-col gap-1 pb-3 border-b border-dashed border-rule-strong text-ink-soft hover:text-oxblood">
        <span className="eyebrow">Remembering</span>
        <span className="text-xl italic font-display">Add the first person…</span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="person-switch" className="eyebrow">
        Remembering
      </label>
      <div className="relative">
        <select
          id="person-switch"
          value={current?.id ?? ''}
          onChange={(e) => (e.target.value === ADD ? navigate('/family') : select(e.target.value))}
          className="w-full cursor-pointer appearance-none border-b-[1.5px] border-ink bg-transparent py-1.5 pr-8 font-display text-2xl text-ink outline-none focus-visible:border-oxblood"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value={ADD}>+ Add someone…</option>
        </select>
        <ChevronDown aria-hidden="true" className="absolute w-5 h-5 -translate-y-1/2 pointer-events-none right-1 top-1/2 text-ink-muted" />
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const [server, setServer] = useState<ServerState>('waking');

  // One ping on load wakes the sleeping Render backend before it's needed.
  useEffect(() => {
    apiService.ping().then((ok) => setServer(ok ? 'online' : 'offline'));
  }, []);

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Side column (a scrolling top bar on phones) */}
      <aside className="flex flex-col gap-5 px-5 py-5 border-b border-rule md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:gap-9 md:overflow-y-auto md:border-b-0 md:border-r md:px-8 md:py-10">
        <Link to="/" className="flex flex-col gap-1">
          <span className="text-3xl italic leading-none font-display text-ink">SwarSmriti</span>
          <span className="text-[13px] text-ink-muted">a family's living archive</span>
        </Link>

        <PersonSwitcher />

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

        <div className="flex-col hidden gap-6 md:mt-auto md:flex">
          <p className="font-display text-[15px] italic leading-relaxed text-ink-soft">“Some voices are too dear to lose.”</p>
          <p className="flex items-center gap-2 text-xs text-ink-muted" aria-live="polite">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status[server].dot}`} />
            {status[server].text}
          </p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-5xl px-5 py-10 mx-auto sm:px-10 md:py-14">
          {server === 'offline' && (
            <p role="alert" className="px-4 py-3 mb-8 text-sm border rounded-lg border-oxblood/30 bg-oxblood/5 text-oxblood-deep">
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