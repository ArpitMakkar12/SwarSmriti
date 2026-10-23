import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, MessageCircle, BookOpen, Mic, Users, Clock, UserRound, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import { Activity, Profile, Stats } from '../types';

const activityLabel: Record<Activity['kind'], string> = {
  memory: 'Added a memory',
  chat: 'Conversation',
  voice_chat: 'Voice conversation',
  voice_clone: 'Voice',
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units: [number, string][] = [
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiService.getStats(), apiService.getProfile()]).then(([s, p]) => {
      if (s.status === 'success' && s.data) setStats(s.data);
      else setError(s.message || 'Could not load stats.');
      if (p.status === 'success' && p.data) setProfile(p.data);
    });
  }, []);

  const show = (n: number | undefined) => (stats ? String(n ?? 0) : '–');
  const statCards = [
    { label: 'Memories Stored', value: show(stats?.memories), icon: Brain, color: 'bg-rose-gold' },
    { label: 'Conversations', value: show(stats?.conversations), icon: MessageCircle, color: 'bg-copper-rose' },
    { label: 'Voice Memories', value: show(stats?.voice_memories), icon: Mic, color: 'bg-rose-gold' },
    { label: 'Active Days', value: show(stats?.active_days), icon: Clock, color: 'bg-copper-rose' },
  ];

  const name = profile?.name || '';
  const quickActions = [
    { title: 'Train New Memory', description: 'Share experiences, thoughts and stories to build the AI personality', icon: Brain, path: '/train', color: 'from-rose-gold to-copper-rose' },
    { title: name ? `Talk to ${name}` : 'Talk to AI', description: 'Have a text or voice conversation with the AI doppelganger', icon: MessageCircle, path: '/talk', color: 'from-copper-rose to-rose-gold' },
    { title: 'View Memories', description: 'Browse, search and manage everything that has been shared', icon: BookOpen, path: '/memories', color: 'from-rose-gold/80 to-copper-rose/80' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="p-6 border sm:p-8 bg-gradient-to-r from-rose-gold/10 to-copper-rose/10 rounded-2xl border-rose-gold/20">
        <div className="flex items-center mb-4 space-x-4">
          <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 bg-gradient-to-br from-rose-gold to-copper-rose rounded-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl text-charcoal">
              {name ? `${name}'s SwarSmriti` : 'Welcome to SwarSmriti'}
            </h1>
            <p className="text-lg text-warm-grey">Your AI Doppelganger - Preserving memories for eternity</p>
          </div>
        </div>
        <p className="leading-relaxed text-charcoal/80">
          Create a lasting digital presence that preserves your voice, personality and memories, so your loved
          ones can keep talking with you.
        </p>
      </div>

      {/* First-time setup nudge */}
      {profile && !profile.name && (
        <Link
          to="/persona"
          className="flex items-center justify-between p-4 transition-colors bg-white border rounded-xl border-copper-rose/40 hover:bg-rose-gold/10"
        >
          <div className="flex items-center space-x-3">
            <UserRound className="w-5 h-5 text-copper-rose" />
            <span className="text-charcoal">
              <strong>Step 1:</strong> tell SwarSmriti whose memories these are, and (optionally) add their voice.
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-copper-rose" />
        </Link>
      )}

      {error && <p className="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-6 transition-all duration-200 bg-white border rounded-xl border-warm-beige hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 mb-4 ${stat.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="mb-1 text-2xl font-bold text-charcoal">{stat.value}</p>
              <p className="text-sm text-warm-grey">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-charcoal">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="p-6 transition-all duration-300 bg-white border group rounded-xl border-warm-beige hover:shadow-xl hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold transition-colors text-charcoal group-hover:text-copper-rose">{action.title}</h3>
                <p className="text-sm leading-relaxed text-warm-grey">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity (real, from the server) */}
      <div className="p-6 bg-white border rounded-xl border-warm-beige">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Recent Activity</h2>
        {stats && stats.recent_activity.length === 0 && (
          <p className="text-sm text-warm-grey">Nothing yet. Train your first memory to get started.</p>
        )}
        <div className="space-y-3">
          {stats?.recent_activity.map((a, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-2 border-b border-warm-beige last:border-b-0">
              <p className="text-sm text-charcoal">
                <span className="font-medium">{activityLabel[a.kind] ?? a.kind}:</span> {a.detail}
              </p>
              <span className="text-xs text-warm-grey whitespace-nowrap">{timeAgo(a.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;