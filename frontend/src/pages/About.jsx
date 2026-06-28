export default function About() {
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <div className="about-hero-badge">من نحن</div>
            <h1>شركة <span>لمار</span> للمياه</h1>
            <p>نقدم أفضل مياه شرب نقية ومعدنية في المملكة العربية السعودية، مع التزام بالجودة والموثوقية وخدمة العملاء المتميزة.</p>
          </div>
        </div>
      </section>

      <section className="about-story">
        <div className="container">
          <div className="story-grid">
            <div className="story-image">💧</div>
            <div className="story-content">
              <div className="section-header" style={{ textAlign: 'right' }}>
                <div className="divider" style={{ margin: '0 0 0.75rem 0' }}></div>
                <h2>قصتنا</h2>
              </div>
              <p>انطلقت شركة لمار للمياه عام 2020 بهدف توفير مياه شرب نقية وعالية الجودة للمنازل والشركات في المملكة العربية السعودية. ما بدأ كفكرة بسيطة تحول إلى واحدة من trusted brands في مجال المياه.</p>
              <p>نستخدم أحدث تقنيات التنقية والتعبئة لضمان أن كل قطرة مياه تصل إليك نقية 100% وخالية من أي شوائب. فريقنا المتخصص يعمل على مدار الساعة لضمان رضا عملائنا.</p>
              <p>اليوم، نحن فخورون بخدمة أكثر من 5,000 عميل في أكثر من 50 مدينة سعودية، مع نسبة رضا تتجاوز 99%.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <div className="section-header">
            <div className="divider"></div>
            <h2>قيمنا</h2>
            <p>المبادئ التي نعمل بها每一天</p>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">✓</div>
              <h3>الجودة</h3>
              <p>نلتزم بأعلى معايير الجودة في كل مرحلة من مراحل الإنتاج والتوصيل.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>الثقة</h3>
              <p>نبني علاقات طويلة الأمد مع عملائنا من خلال الشفافية والموثوقية.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🚀</div>
              <h3>الابتكار</h3>
              <p>نطور خدماتنا باستمرار لنقدم أفضل تجربة لعملائنا.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌍</div>
              <h3>الاستدامة</h3>
              <p>نحرص على الممارسات الصديقة للبيئة في جميع عملياتنا.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
