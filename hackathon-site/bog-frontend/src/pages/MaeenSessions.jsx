export default function MaeenSessions() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold">🎥 خدمة الجلسات القضائية الإلكترونية</h1>
          <p className="mt-2 opacity-90">حضور الجلسات القضائية عن بُعد بتقنية الفيديو والصوت</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 relative min-h-[600px]">
          <iframe 
            src="http://localhost:5173" 
            title="الجلسات القضائية الإلكترونية"
            allow="camera; microphone; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
