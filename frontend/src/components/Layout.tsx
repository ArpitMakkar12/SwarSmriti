import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Brain, MessageCircle, BookOpen, Home, Mic } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/train', icon: Brain, label: 'Train Memory' },
    { path: '/talk', icon: MessageCircle, label: 'Talk' },
    { path: '/memories', icon: BookOpen, label: 'Memories' },
  ];

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="bg-white border-b shadow-sm border-warm-beige">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-rose-gold to-copper-rose">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-charcoal">SwarSmriti</h1>
                <p className="text-sm text-warm-grey">Keep memories alive forever</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r shadow-sm border-warm-beige">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-rose-gold/20 text-copper-rose border border-rose-gold/30' 
                      : 'text-warm-grey hover:bg-warm-beige/50 hover:text-charcoal'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 border rounded-lg bg-gradient-to-r from-rose-gold/10 to-copper-rose/10 border-rose-gold/20">
              <p className="text-sm text-center text-warm-grey">
                Preserving memories for eternity
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-ivory">
          <div className="max-w-6xl p-6 mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;