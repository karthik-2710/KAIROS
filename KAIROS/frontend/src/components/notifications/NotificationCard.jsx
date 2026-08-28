import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Clock, Info, AlertTriangle, ShieldAlert, CheckCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SeverityIcon = ({ severity }) => {
  switch (severity) {
    case 'Critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'Warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'Recommendation': return <CheckCircle className="w-5 h-5 text-green-500" />;
    default: return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const SeverityBadge = ({ severity }) => {
  const styles = {
    Critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    Warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    Recommendation: 'bg-green-500/10 text-green-500 border-green-500/20',
    Information: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  const style = styles[severity] || styles.Information;
  
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style}`}>
      {severity}
    </span>
  );
};

export const NotificationCard = ({ notification, onRead, onClickAction }) => {
  return (
    <div className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notification.is_read ? 'bg-white/[0.02]' : ''}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <SeverityIcon severity={notification.severity} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h4 className={`text-sm font-medium text-white truncate ${!notification.is_read ? 'font-semibold' : ''}`}>
              {notification.title}
            </h4>
            <div className="flex-shrink-0">
              <SeverityBadge severity={notification.severity} />
            </div>
          </div>
          
          <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
            {notification.description}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center text-[11px] text-zinc-500">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              {notification.farm_name && (
                <>
                  <span className="mx-2">•</span>
                  <span className="truncate max-w-[100px]">{notification.farm_name}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {notification.action_url && (
                <button 
                  onClick={() => onClickAction && onClickAction(notification)}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center"
                >
                  View <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
              )}
              {!notification.is_read && onRead && (
                <button 
                  onClick={() => onRead(notification.id)}
                  className="w-2 h-2 rounded-full bg-brand-500"
                  title="Mark as read"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
