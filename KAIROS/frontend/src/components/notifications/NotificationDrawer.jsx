import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { NotificationCard } from './NotificationCard';
import Button from '../ui/Button';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notifications?limit=20');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-zinc-900 border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full text-zinc-500">
                  <Bell className="w-12 h-12 mb-3 opacity-20" />
                  <p>You have no notifications</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <NotificationCard 
                    key={notif.id} 
                    notification={notif} 
                    onRead={handleMarkAsRead}
                    onClickAction={(n) => {
                      if(n.action_url) {
                        onClose();
                        navigate(n.action_url);
                      }
                    }}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={handleViewAll}
              >
                View All Notifications
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
