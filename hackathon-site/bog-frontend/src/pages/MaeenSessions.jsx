import { useState } from 'react';
import WebRTCMeeting from '../components/WebRTCMeeting';

export default function MaeenSessions() {
  const [inSession, setInSession] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const handleJoinSession = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    setSessionData({
      roomId: formData.get('roomId'),
      userName: formData.get('userName'),
      userRole: formData.get('userRole')
    });
    setInSession(true);
  };

  const handleLeaveSession = () => {
    setInSession(false);
    setSessionData(null);
  };

  if (inSession && sessionData) {
    return (
      <WebRTCMeeting
        roomId={sessionData.roomId}
        userName={sessionData.userName}
        userRole={sessionData.userRole}
        onLeave={handleLeaveSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-3">🎥 خدمة الجلسات القضائية الإلكترونية</h1>
          <p className="text-xl opacity-90">حضور الجلسات القضائية عن بُعد بتقنية الفيديو والصوت</p>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">الانضمام إلى الجلسة</h2>
          
          <form onSubmit={handleJoinSession} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="roomId">
                رقم الجلسة
              </label>
              <input
                type="text"
                id="roomId"
                name="roomId"
                required
                placeholder="أدخل رقم الجلسة"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="userName">
                الاسم
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                required
                placeholder="أدخل اسمك"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="userRole">
                الدور
              </label>
              <select
                id="userRole"
                name="userRole"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر الدور</option>
                <option value="judge">القاضي</option>
                <option value="lawyer">المحامي</option>
                <option value="party">طرف في القضية</option>
                <option value="participant">مشارك</option>
              </select>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ ملاحظة:</strong> سيطلب المتصفح الإذن باستخدام الكاميرا والمايكروفون عند الانضمام.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              🚀 الانضمام إلى الجلسة
            </button>
          </form>

          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ متطلبات النظام:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• متصفح حديث (Chrome, Firefox, Safari, Edge)</li>
              <li>• كاميرا ومايكروفون</li>
              <li>• اتصال إنترنت مستقر</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
