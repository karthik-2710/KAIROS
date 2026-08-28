import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Search, Filter } from 'lucide-react';
import api from "../services/api";
import { NotificationCard } from '../components/notifications/NotificationCard';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notifications?limit=100');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">Notification Center</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">View all your alerts, recommendations, and updates</p>
          </div>
        </div>
        <button 
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-bg)] transition-colors text-sm font-medium text-[var(--color-text-primary)]"
        >
          <CheckCircle2 className="w-4 h-4 text-brand-500" />
          Mark all as read
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-4 bg-[var(--color-bg)]/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input 
              type="text" 
              placeholder="Search notifications..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-bg)] transition-colors text-sm font-medium text-[var(--color-text-primary)]">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="divide-y divide-[var(--color-border)] min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center h-full text-zinc-500">
              <Bell className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-[var(--color-text-primary)]">You're all caught up!</p>
              <p className="text-sm mt-1">No notifications to show</p>
            </div>
          ) : (
            notifications.map(notif => (
              <NotificationCard 
                key={notif.id} 
                notification={notif} 
                onRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
