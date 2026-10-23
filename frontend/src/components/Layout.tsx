import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Brain, MessageCircle, BookOpen, Home, Mic, UserRound } from 'lucide-react';
import { apiService } from '../services/api';

type ServerState = 'waking' | 'online' | 'offline';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/persona', icon: UserRound, label: 'Persona & Voice' },
  { path: '/train', icon: Brain, label: 'Train Memory' },
  { path: '/talk', icon: MessageCircle, label: 'Talk' },
  { path: '/memories', icon: BookOpen, label: 'Memories' },
];

const statusStyle: Record<ServerState, { dot: string; text: string }> = {
  waking: { dot: 'bg-amber-400 animate-pulse', text: 'Waking server… (up to a minute)' },
  online: { dot: 'bg-green-500', text: 'Server online' },
  offline: { dot: 'bg-red-500', text: 'Server unreachable' },
};

const Layout: React.FC = () => {
  const location = useLocation();
  const [server, setServer] = useState<ServerState>('waking');

  // Ping once on load: wakes the sleeping Render backend before the user needs it.
  useEffect(() => {
    apiService.ping().then((ok) => setServer(ok ? 'online' : 'offline'));
  }, []);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="bg-white border-b shadow-sm border-warm-beige">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-rose-gold to-copper-rose">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight text-charcoal">SwarSmriti</h1>
              <p className="text-xs text-warm-grey sm:text-sm">Keep memories alive forever</p>
            </div>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-warm-grey" title={statusStyle[server].text}>
            <span className={`w-2.5 h-2.5 rounded-full ${statusStyle[server].dot}`} />
            <span className="hidden sm:inline">{statusStyle[server].text}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)]">
        {/* Sidebar (a scrollable top bar on phones) */}
        <aside className="bg-white border-b md:border-b-0 md:border-r shadow-sm md:w-64 border-warm-beige md:flex md:flex-col">
          <nav className="flex p-2 space-x-1 overflow-x-auto md:flex-col md:p-4 md:space-x-0 md:space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-rose-gold/20 text-copper-rose border border-rose-gold/30'
                      : 'text-warm-grey hover:bg-warm-beige/50 hover:text-charcoal border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer: pushed to the bottom of the sidebar instead of floating over the page */}
          <div className="hidden p-4 mt-auto md:block">
            <div className="p-3 border rounded-lg bg-gradient-to-r from-rose-gold/10 to-copper-rose/10 border-rose-gold/20">
              <p className="text-sm text-center text-warm-grey">Preserving memories for eternity</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-ivory">
          <div className="max-w-6xl p-4 mx-auto sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;