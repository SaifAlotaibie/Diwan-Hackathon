import { useState, useEffect } from 'react';
import axios from 'axios';

const API_SERVER = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function ComplianceMonitor({ 
  isChair, 
  participants, 
  localStream,
  remoteStreams 
}) {
  const [violations, setViolations] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);

  // Camera monitoring - detect when camera is off
  useEffect(() => {
    const checkCameraStatus = () => {
      participants.forEach(participant => {
        const stream = remoteStreams.current.get(participant.socketId);
        if (stream) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack && !videoTrack.enabled) {
            addViolation({
              type: 'camera_off',
              participant: participant.participantId,
              socketId: participant.socketId,
              role: participant.role,
              timestamp: new Date().toISOString(),
              severity: 'high'
            });
          }
        }
      });
    };

    const interval = setInterval(checkCameraStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [participants, remoteStreams]);

  // Environment and behavior monitoring using AI
  useEffect(() => {
    if (!isChair || !localStream) return;

    const monitorEnvironmentAndBehavior = async () => {
      try {
        // Capture frames from all participants
        const frames = await captureAllParticipantFrames();
        
        // Send to AI for analysis
        const response = await axios.post(`${API_SERVER}/analyze-session-environment`, {
          frames,
          participants: participants.map(p => ({
            id: p.participantId,
            role: p.role,
            socketId: p.socketId
          }))
        });

        if (response.data.alerts && response.data.alerts.length > 0) {
          response.data.alerts.forEach(alert => {
            addAIAlert(alert);
          });
        }
      } catch (err) {
        console.error('❌ Environment monitoring error:', err);
      }
    };

    // Monitor every 30 seconds (not too frequent to avoid API costs)
    const interval = setInterval(monitorEnvironmentAndBehavior, 30000);
    return () => clearInterval(interval);
  }, [isChair, localStream, participants]);

  const captureAllParticipantFrames = async () => {
    const frames = [];
    
    for (const participant of participants) {
      const stream = remoteStreams.current.get(participant.socketId);
      if (stream) {
        const frame = await captureVideoFrame(stream);
        if (frame) {
          frames.push({
            participantId: participant.participantId,
            role: participant.role,
            socketId: participant.socketId,
            imageBase64: frame
          });
        }
      }
    }
    
    return frames;
  };

  const captureVideoFrame = async (stream) => {
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      video.pause();
      video.srcObject = null;
      
      return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    } catch (err) {
      console.error('Frame capture error:', err);
      return null;
    }
  };

  const addViolation = (violation) => {
    setViolations(prev => {
      // Avoid duplicates (same participant, same type within 1 minute)
      const recent = prev.find(v => 
        v.socketId === violation.socketId && 
        v.type === violation.type &&
        new Date(v.timestamp).getTime() > Date.now() - 60000
      );
      
      if (recent) return prev;
      
      return [violation, ...prev].slice(0, 20); // Keep last 20
    });
  };

  const addAIAlert = (alert) => {
    setAiAlerts(prev => {
      return [{
        ...alert,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 10); // Keep last 10
    });
  };

  const dismissAlert = (id) => {
    setAiAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const dismissViolation = (index) => {
    setViolations(prev => prev.filter((_, i) => i !== index));
  };

  const getViolationMessage = (violation) => {
    const messages = {
      'camera_off': `تنبيه: المشارك "${violation.participant}" قام بإغلاق الكاميرا`,
      'phone_usage': `تنبيه: المشارك "${violation.participant}" يستخدم الهاتف الجوال`,
      'eating_drinking': `تنبيه: المشارك "${violation.participant}" يأكل أو يشرب`,
      'distraction': `تنبيه: المشارك "${violation.participant}" غير منتبه للجلسة`,
      'inappropriate_environment': `تنبيه: المشارك "${violation.participant}" في بيئة غير مناسبة`,
      'dress_code': `تنبيه: المشارك "${violation.participant}" غير ملتزم بالزي الرسمي`,
      'side_conversation': `تنبيه: المشارك "${violation.participant}" يتحدث جانبياً`
    };
    return messages[violation.type] || `تنبيه: مخالفة من "${violation.participant}"`;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-yellow-100 border-yellow-400 text-yellow-800',
      'medium': 'bg-orange-100 border-orange-400 text-orange-800',
      'high': 'bg-red-100 border-red-400 text-red-800'
    };
    return colors[severity] || colors.medium;
  };

  // Only show to session chair
  if (!isChair) return null;

  return (
    <div className="fixed top-20 right-4 w-96 max-h-[calc(100vh-100px)] overflow-y-auto z-50">
      <div className="space-y-3">
        {/* AI Alerts */}
        {aiAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={`border-2 rounded-lg p-4 shadow-lg animate-pulse ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-bold">تنبيه ذكي من الذكاء الاصطناعي</span>
                </div>
                <p className="text-sm mb-2">{alert.message_ar || alert.message}</p>
                {alert.details && (
                  <p className="text-xs opacity-75">{alert.details}</p>
                )}
                <p className="text-xs mt-2 opacity-60">
                  {new Date(alert.timestamp).toLocaleTimeString('ar-SA')}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-xl hover:scale-110 transition-transform"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* Violation Alerts */}
        {violations.map((violation, idx) => (
          <div 
            key={idx}
            className={`border-2 rounded-lg p-4 shadow-lg ${getSeverityColor(violation.severity)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-bold">مخالفة قواعد الجلسة</span>
                </div>
                <p className="text-sm mb-1">{getViolationMessage(violation)}</p>
                <p className="text-xs opacity-75">
                  الدور: {getRoleLabel(violation.role)}
                </p>
                <p className="text-xs mt-2 opacity-60">
                  {new Date(violation.timestamp).toLocaleTimeString('ar-SA')}
                </p>
              </div>
              <button
                onClick={() => dismissViolation(idx)}
                className="text-xl hover:scale-110 transition-transform"
              >
                ✕
              </button>
            </div>
            
            {violation.type === 'camera_off' && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className="text-xs font-semibold">📌 الإجراء المطلوب:</p>
                <p className="text-xs">يجب على المشارك إعادة تشغيل الكاميرا فوراً وفقاً لقواعد الجلسة القضائية</p>
              </div>
            )}
          </div>
        ))}

        {/* Status indicator when all clear */}
        {violations.length === 0 && aiAlerts.length === 0 && (
          <div className="bg-green-100 border-2 border-green-400 text-green-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold">الجلسة منضبطة</p>
                <p className="text-xs">لا توجد مخالفات حالياً</p>
              </div>
            </div>
          </div>
        )}
      </div>
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
