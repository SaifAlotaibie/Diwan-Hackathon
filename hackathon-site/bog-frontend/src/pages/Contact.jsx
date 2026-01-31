export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">اتصل بنا</h1>
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">العنوان</h3>
                <p className="text-gray-700">الرياض - المملكة العربية السعودية</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">الهاتف</h3>
                <p className="text-gray-700" dir="ltr">920000105</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">البريد الإلكتروني</h3>
                <p className="text-gray-700">info@bog.gov.sa</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
