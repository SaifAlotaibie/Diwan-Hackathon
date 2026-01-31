export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">عن الديوان</h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-700 leading-loose text-lg mb-6">
              ديوان المظالم هيئة قضاء إداري مستقلة يرتبط مباشرة بالملك، يسعى لإرساء العدل والإنصاف
              والرقابة القضائية الفاعلة على أعمال الإدارة من خلال الدعاوى الماثلة أمامه.
            </p>
            <p className="text-gray-700 leading-loose text-lg">
              يضمن الديوان حسن تطبيق الأنظمة واللوائح وتمكين صاحب الحق من وسائل التظلم، 
              بما يكفل حماية الحقوق وتطبيق الأحكام الشرعية وتحقيق العدل ورد المظالم.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
