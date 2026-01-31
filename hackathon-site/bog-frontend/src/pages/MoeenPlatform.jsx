import { Link } from 'react-router-dom';

export default function MoeenPlatform() {
  const services = [
    {
      icon: '👥',
      title: 'الخدمات القضائية للمسجلين',
      description: 'خدمات قضائية شاملة للمستخدمين المسجلين في منصة معين',
      link: '#',
      logo: null
    },
    {
      icon: '📋',
      title: 'الخدمات القضائية لغير المسجلين',
      description: 'خدمات قضائية متاحة للمستخدمين غير المسجلين',
      link: '#',
      logo: null
    },
    {
      icon: '🏛️',
      title: 'بوابة الجهات الحكومية',
      description: 'بوابة خاصة بالجهات الحكومية للتعامل مع القضايا الإدارية',
      link: '#',
      logo: null
    },
    {
      icon: '🎥',
      title: 'الجلسات القضائية الإلكترونية',
      description: 'حضور الجلسات القضائية عن بُعد بتقنية الفيديو والصوت',
      link: '/maeen-sessions',
      logo: '/assets/Moeen.svg'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <section className="bg-primary text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <img src="/assets/Moeen.svg" alt="منصة معين" className="h-16 w-auto" />
            <h1 className="text-4xl font-bold">منصة معين الرقمية</h1>
          </div>
          <p className="text-xl opacity-90 max-w-3xl">
            منصة رقمية تقدم خدمات قضائية وفق نظام المرافعات أمام ديوان المظالم ولائحته التنفيذية
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50 flex-1">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">خدمات المنصة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg text-center shadow-md hover:shadow-xl hover:-translate-y-2 transition-all border-2 border-transparent hover:border-primary"
              >
                {service.logo ? (
                  <div className="mb-4 flex justify-center">
                    <img src={service.logo} alt={service.title} className="h-16 w-auto" />
                  </div>
                ) : (
                  <div className="text-5xl mb-4">{service.icon}</div>
                )}
                <h3 className="text-xl font-semibold mb-3 text-gray-900 leading-snug">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                {service.link === '/maeen-sessions' ? (
                  <Link to={service.link} className="text-primary font-medium inline-flex items-center gap-2 hover:text-primary-dark">
                    الدخول للخدمة ←
                  </Link>
                ) : (
                  <a href={service.link} className="text-primary font-medium inline-flex items-center gap-2 hover:text-primary-dark">
                    الدخول للخدمة ←
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
