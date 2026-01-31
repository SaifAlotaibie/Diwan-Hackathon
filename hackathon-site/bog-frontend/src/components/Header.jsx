import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: 'عن الديوان', path: '/' },
    { label: 'الخدمات الإلكترونية', path: '#' },
    { label: 'الأنظمة والسياسات', path: '#' },
    { label: 'المركز الإعلامي', path: '#' },
    { label: 'مجلس القضاء الإداري', path: '#' },
    { label: 'المشاركة الإلكترونية', path: '#' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="bg-primary text-white py-2 text-center">
        <div className="container mx-auto px-6">
          <p className="text-sm">موقع حكومي رسمي تابع لحكومة المملكة العربية السعودية</p>
        </div>
      </div>

      <nav className="py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-shrink-0">
              <img 
                src="/assets/logo.svg" 
                alt="شعار ديوان المظالم" 
                className="h-[45px] w-auto"
              />
            </div>

            <ul className="flex gap-6 flex-1 justify-center items-center">
              {menuItems.map((item, index) => (
                <li key={index}>
                  {item.path === '#' ? (
                    <a
                      href={item.path}
                      className="text-black font-medium text-[0.95rem] px-2 py-1 rounded-md transition-all hover:text-primary hover:bg-gray-50 whitespace-nowrap"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      className={`font-medium text-[0.95rem] px-2 py-1 rounded-md transition-all hover:text-primary hover:bg-gray-50 whitespace-nowrap ${
                        isActive(item.path) ? 'text-black font-semibold' : 'text-black'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
