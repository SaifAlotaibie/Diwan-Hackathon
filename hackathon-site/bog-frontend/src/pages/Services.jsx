import { Link } from 'react-router-dom';

export default function Services() {
  const services = [
    {
      icon: '🖥️',
      title: 'منصة معين الرقمية',
      description: 'منصة رقمية تقدم خدمات قضائية وفق نظام المرافعات أمام ديوان المظالم ولائحته التنفيذية، بداية من تقديم الدعوى والطلبات القضائية ومتابعتها، وحضور جلساتها، وحتى استلام نسخة الحكم.',
      link: '/moeen-platform',
      logo: '/assets/Moeen.svg'
    },
    {
      icon: '🤝',
      title: 'تقديم طلب لقاء معالي الرئيس',
      description: 'خدمة تمكن المستفيد من تقديم طلب لقاء معالي رئيس ديوان المظالم، وهي خدمة إلكترونية تقدم دون الحاجة لمراجعة مقر الجهة.',
      link: '#',
      logo: '/assets/meetPresident.svg'
    },
    {
      icon: '✉️',
      title: 'راسل رئيس الديوان',
      description: 'تمكنك الخدمة من التواصل مع رئيس ديوان المظالم',
      link: '#',
      logo: '/assets/meetPresident.svg'
    },
    {
      icon: '⚖️',
      title: 'منصة التنفيذ الإدارية',
      description: 'تُتيح الاستفادة من الخ​دمات القضائية في محكمة التنفيذ الإدارية وفق نظام التنفيذ أمام ديوان المظالم.',
      link: '#',
      logo: '/assets/Tanfeeth-log.svg'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">الخدمات الإلكترونية</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg text-center shadow-md hover:shadow-xl hover:-translate-y-2 transition-all border-2 border-transparent hover:border-primary"
              >
                {service.logo ? (
                  <div className="mb-4 flex justify-center">
                    <img src={service.logo} alt={service.title} className="h-12 w-auto" />
                  </div>
                ) : (
                  <div className="text-4xl mb-4">{service.icon}</div>
                )}
                <h3 className="text-lg font-semibold mb-3 text-gray-900 leading-snug">{service.title}</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{service.description}</p>
                {service.link === '/moeen-platform' || service.link === '/maeen-sessions' ? (
                  <Link to={service.link} className="text-primary font-medium text-sm inline-flex items-center gap-2 hover:text-primary-dark">
                    الدخول للخدمة ←
                  </Link>
                ) : (
                  <a href={service.link} className="text-primary font-medium text-sm inline-flex items-center gap-2 hover:text-primary-dark">
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
