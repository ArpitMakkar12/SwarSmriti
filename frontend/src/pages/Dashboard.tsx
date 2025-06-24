import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, MessageCircle, BookOpen, Mic, Users, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Memories Stored', value: '24', icon: Brain, color: 'bg-rose-gold' },
    { label: 'Conversations', value: '12', icon: MessageCircle, color: 'bg-copper-rose' },
    { label: 'Voice Hours', value: '3.2', icon: Mic, color: 'bg-rose-gold' },
    { label: 'Active Days', value: '15', icon: Clock, color: 'bg-copper-rose' },
  ];

  const quickActions = [
    {
      title: 'Train New Memory',
      description: 'Share experiences, thoughts, and memories to build your AI personality',
      icon: Brain,
      path: '/train',
      color: 'from-rose-gold to-copper-rose',
    },
    {
      title: 'Talk to AI',
      description: 'Have a conversation with your AI doppelganger',
      icon: MessageCircle,
      path: '/talk',
      color: 'from-copper-rose to-rose-gold',
    },
    {
      title: 'View Memories',
      description: 'Browse and manage all stored memories and experiences',
      icon: BookOpen,
      path: '/memories',
      color: 'from-rose-gold/80 to-copper-rose/80',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="p-8 border bg-gradient-to-r from-rose-gold/10 to-copper-rose/10 rounded-2xl border-rose-gold/20">
        <div className="flex items-center mb-4 space-x-4">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-gold to-copper-rose rounded-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Welcome to SwarSmriti</h1>
            <p className="text-lg text-warm-grey">Your AI Doppelganger - Preserving memories for eternity</p>
          </div>
        </div>
        <p className="leading-relaxed text-charcoal/80">
          Create an eternal digital presence that preserves your voice, personality, and memories. Train your AI doppelganger today so your loved ones can continue conversations with you forever.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-6 transition-all duration-200 bg-white border rounded-xl border-warm-beige hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-charcoal">{stat.value}</p>
                <p className="text-sm text-warm-grey">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-charcoal">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.path}
                className="p-6 transition-all duration-300 bg-white border group rounded-xl border-warm-beige hover:shadow-xl hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold transition-colors text-charcoal group-hover:text-copper-rose">
                  {action.title}
                </h3>
                <p className="text-sm leading-relaxed text-warm-grey">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white border rounded-xl border-warm-beige">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { action: 'Added new memory about childhood experiences', time: '2 hours ago' },
            { action: 'Had a conversation about family values', time: '1 day ago' },
            { action: 'Trained AI with voice recording', time: '3 days ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-warm-beige last:border-b-0">
              <p className="text-sm text-charcoal">{activity.action}</p>
              <span className="text-xs text-warm-grey">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;