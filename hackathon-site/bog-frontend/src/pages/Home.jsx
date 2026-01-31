import { Link } from 'react-router-dom';

export default function Home() {
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

  const stats = [
    { number: '+1000', label: 'قاضي' },
    { number: '+50', label: 'محكمة' },
    { number: '24/7', label: 'خدمات إلكترونية' },
    { number: '+100K', label: 'قضية سنوياً' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-l from-primary-dark to-primary py-32">
        <div className="container mx-auto px-6">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">بوابة ديوان المظالم</h1>
            <p className="text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
              هيئة قضاء إداري مستقلة يرتبط مباشرة بالملك، يسعى لإرساء العدل والإنصاف
              والرقابة القضائية الفاعلة على أعمال الإدارة من خلال الدعاوى الماثلة أمامه
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="#"
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                الخدمات الإلكترونية
              </a>
              <a
                href="#"
                className="bg-secondary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-secondary-dark transition-all shadow-lg"
              >
                تعرف على الديوان
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">الخدمات الإلكترونية</h2>
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

      {/* President Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-6">
          <div className="bg-white p-12 rounded-xl shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
              <div className="text-center">
                <img 
                  src="/assets/PresidentPic.webp" 
                  alt="معالي الرئيس" 
                  className="w-full rounded-xl shadow-lg mb-6"
                />
                <h3 className="text-secondary text-xl font-semibold mb-2">معالي الرئيس</h3>
                <h4 className="text-secondary text-lg font-semibold mb-1">الدكتور خالد بن محمد اليوسف</h4>
                <p className="text-secondary text-base font-medium">رئيس ديوان المظالم</p>
              </div>
              
              <div>
                <h2 className="text-secondary text-3xl font-bold mb-8 pb-4 border-b-4 border-secondary">كلمة معالي الرئيس</h2>
                
                <div className="text-gray-700 leading-loose text-lg space-y-6">
                  <p>تعيش بلادُنا الغالية، في ظلّ قيادة خادم الحرمين الشريفين وسمو ولي العهد الأمين، نقلةً نوعية في القطاعين العام والإداري، لم يُشهد لها مثيل، من حيث التحول الرقمي والحوكمــة، بهدف تقنين الأعمـــال وتيســير إنجازها لخدمــة المواطنيــن والمقيمين، وتحسين جودة الحياة في مختلف مدن المملكة ومرافقها وقطاعاتها العامة.</p>
                  
                  <p>وكان ديوان المظالم في طليعة تلك الجهات التي واكبت هذا التحول، فاستوعب متطلباته، وأتقن أدواته، إيمانًا بدوره المحوري كجهة قضائية مستقلة ترتبط أعمالها بمختلف مؤسسات الدولة.</p>
                  
                  <p>وبدعم كريم من قيادتنا الرشيدة، وبتوجيهاتها الملهمة، نجح ديوان المظالم -في فترة وجيزة- في تحويل جميع خدماته القضائية والإدارية إلى خدمات رقمية، والتكامل مـع منظومـة الحوكمــة الوطنيـة، بمـا يحقق الكفـاءة ويُسرّع الإنجاز، حـتى تضاعفت مخرجاته، وتقلّصـــت مــدد إجراءاته، ولا يــزال ماضيًا في مسيرته بثبــات.</p>
                  
                  <p>ويؤمن الديوان أن تجربة المستفيد هي المعيار الحقيقي لنجاح ما تحقق من تحوّلات رقمية، لذلك يرحّب دومًا بالملاحظات والمقترحات التي تعينه على تطوير خدماته والارتقاء بها.</p>
                  
                  <p className="mb-0">وتقبلوا تحياتي وتقديري، إلى أن نلتقي بكم مجددًا على دروب الطموح، نحو مستقبل أكثر جودة وازدهارًا في وطننا العظيم.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold mb-3">{stat.number}</div>
                <div className="text-xl">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
