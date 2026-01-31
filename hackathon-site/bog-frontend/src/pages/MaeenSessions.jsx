export default function MaeenSessions() {
  const webrtcUrl = "http://192.168.100.3:5173";
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold">🎥 خدمة الجلسات القضائية الإلكترونية</h1>
          <p className="mt-2 opacity-90">حضور الجلسات القضائية عن بُعد بتقنية الفيديو والصوت</p>
          
          <div className="mt-6 bg-yellow-100 text-yellow-900 p-4 rounded-lg">
            <p className="font-semibold mb-2">⚠️ مهم: للوصول للكاميرا والمايكروفون</p>
            <p className="text-sm mb-3">المتصفحات الحديثة قد تمنع الوصول للكاميرا داخل الإطار. إذا واجهت مشكلة، اضغط الزر أدناه:</p>
            <a 
              href={webrtcUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-md"
            >
              🚀 افتح الجلسة في نافذة جديدة
            </a>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 relative min-h-[600px]">
          <iframe 
            src={webrtcUrl}
            title="الجلسات القضائية الإلكترونية"
            allow="camera *; microphone *; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
