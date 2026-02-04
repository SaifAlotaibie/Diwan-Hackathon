import { useState, useEffect } from 'react';

/**
 * Live Alerts Component
 * Shows real-time compliance alerts to ALL participants
 * (Different from ComplianceMonitor which is chair-only)
 */
export default function LiveAlerts({ socket, roomId, isChair }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for camera violations
    socket.on('camera-violation', (violation) => {
      console.log('📹 Camera violation received:', violation);
      addAlert({
        id: Date.now() + Math.random(),
        type: 'camera_off',
        severity: 'high',
        message: violation.message_ar || `⚠️ تنبيه: المشارك "${violation.participantId}" قام بإغلاق الكاميرا`,
        participantId: violation.participantId,
        role: violation.role,
        timestamp: violation.timestamp,
        icon: '📹'
      });
    });

    // Listen for general compliance alerts
    socket.on('compliance-alert-received', (alert) => {
      console.log('⚠️ Compliance alert received:', alert);
      addAlert({
        id: Date.now() + Math.random(),
        type: alert.type,
        severity: alert.severity || 'medium',
        message: alert.message_ar || alert.message,
        participantId: alert.participantId,
        timestamp: alert.timestamp,
        icon: getAlertIcon(alert.type)
      });
    });

    // Listen for violation notifications (all participants)
    socket.on('violation-notification', (violation) => {
      console.log('🚨 Violation notification:', violation);
      addAlert({
        id: Date.now() + Math.random(),
        type: violation.type,
        severity: violation.severity || 'medium',
        message: violation.message_ar || violation.message,
        participantId: violation.participantId,
        timestamp: violation.timestamp,
        icon: getAlertIcon(violation.type)
      });
    });

    return () => {
      socket.off('camera-violation');
      socket.off('compliance-alert-received');
      socket.off('violation-notification');
    };
  }, [socket]);

  const addAlert = (alert) => {
    setAlerts(prev => {
      // Avoid duplicates
      const exists = prev.find(a => 
        a.participantId === alert.participantId && 
        a.type === alert.type &&
        Date.now() - new Date(a.timestamp).getTime() < 10000
      );
      
      if (exists) return prev;
      
      // Keep last 5 alerts
      return [alert, ...prev].slice(0, 5);
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      dismissAlert(alert.id);
    }, 15000);
  };

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getAlertIcon = (type) => {
    const icons = {
      'camera_off': '📹',
      'phone_usage': '📱',
      'eating_drinking': '🍽️',
      'distraction': '👀',
      'inappropriate_environment': '🏢',
      'dress_code': '👔',
      'side_conversation': '💬'
    };
    return icons[type] || '⚠️';
  };

  const getSeverityStyle = (severity) => {
    const styles = {
      'low': 'bg-yellow-100 border-yellow-400 text-yellow-900',
      'medium': 'bg-orange-100 border-orange-400 text-orange-900',
      'high': 'bg-red-100 border-red-500 text-red-900'
    };
    return styles[severity] || styles.medium;
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 left-4 w-96 max-w-[calc(100vw-2rem)] z-50 space-y-2">
      {alerts.map((alert) => (
        <div 
          key={alert.id}
          className={`border-2 rounded-lg p-4 shadow-2xl animate-[slideInLeft_0.3s_ease-out] ${getSeverityStyle(alert.severity)}`}
          style={{
            animation: 'slideInLeft 0.3s ease-out'
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{alert.icon}</span>
                <span className="font-bold text-lg">تنبيه قواعد الجلسة</span>
              </div>
              
              <p className="text-sm font-semibold mb-1">{alert.message}</p>
              
              {alert.participantId && (
                <p className="text-xs opacity-75 mb-1">
                  المشارك: {alert.participantId}
                  {alert.role && ` (${getRoleLabel(alert.role)})`}
                </p>
              )}
              
              <p className="text-xs opacity-60">
                {new Date(alert.timestamp).toLocaleTimeString('ar-SA')}
              </p>
              
              {alert.severity === 'high' && (
                <div className="mt-2 pt-2 border-t border-current/20">
                  <p className="text-xs font-bold flex items-center gap-1">
                    <span>⚖️</span>
                    <span>يرجى الالتزام بقواعد الجلسة القضائية</span>
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-xl hover:scale-125 transition-transform flex-shrink-0"
              title="إخفاء"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function getRoleLabel(role) {
  const roleLabels = {
    'chair': 'رئيس الجلسة',
    'judge': 'القاضي',
    'secretary': 'أمين السر',
    'lawyer': 'المحامي',
    'party': 'طرف معني',
    'participant': 'مشارك'
  };
  return roleLabels[role] || role;
}
