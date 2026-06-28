import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getProducts, getActivePromotions } from '../api'
import AnimatedSection from '../components/AnimatedSection'
import CountUp from '../components/CountUp'
import { SkeletonCard } from '../components/Skeleton'

const testimonials = [
  { stars: '★★★★★', text: '"ممتازين في التوصيل والمياه نقية وجودة عالية. أنصح الجميع بالتعامل معهم."', initial: 'أ', name: 'أحمد السبيعي', title: 'عميل منتظم' },
  { stars: '★★★★★', text: '"خدمة رائعة وسرعة في التوصيل. الطلب يوصل في نفس اليوم، سعر منافس وجودة ممتازة."', initial: 'ن', name: 'نورة القحطاني', title: 'عميلة جديدة' },
  { stars: '★★★★★', text: '"من أفضل شركات المياه اللي تعاملت معها. التزام بالمواعيد وجودة ثابتة. يعطيكم العافية."', initial: 'م', name: 'محمد الحربي', title: 'عميل منذ سنتين' },
]

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [promotions, setPromotions] = useState([])
  const [cat, setCat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tSlide, setTSlide] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    Promise.all([getCategories(), getProducts(), getActivePromotions()]).then(([cats, prods, promos]) => {
      setCategories(cats || [])
      setProducts(prods || [])
      setPromotions(promos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => setTSlide(s => (s + 1) % testimonials.length), 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  function getProductPromo(product) {
    const now = new Date()
    return promotions.find(p => {
      const s = p.start_date ? new Date(p.start_date) : null
      const e = p.end_date ? new Date(p.end_date) : null
      if (s && s > now) return false
      if (e && e < now) return false
      if (p.applicable_to === 'all') return true
      if (p.applicable_to === 'specific_product') return Number(p.product_id) === Number(product.id)
      if (p.applicable_to === 'specific_category') return Number(p.category_id) === Number(product.category_id)
      return false
    })
  }

  function promoTag(promo) {
    if (!promo) return null
    return promo.type === 'buy_x_get_y'
      ? `🎁 اشتر ${promo.buy_quantity} واحصل على ${promo.free_quantity} مجاناً`
      : `🏷️ خصم ${promo.discount_percent}%`
  }

  function addToCart(p) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(i => i.id === p.id)
    if (existing) existing.qty += 1
    else cart.push({ id: p.id, name_ar: p.name_ar, price: parseFloat(p.price), qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    const el = document.querySelector('.cart-count')
    if (el) { el.classList.remove('cart-badge-bounce'); void el.offsetWidth; el.classList.add('cart-badge-bounce') }
  }

  const filtered = cat ? products.filter(p => p.category_id === cat) : products

  return (
    <>
      <section className="hero">
        <div className="hero-water-drop" style={{ top: '15%', right: '10%', fontSize: '3rem', animationDelay: '0s' }}>💧</div>
        <div className="hero-water-drop" style={{ top: '40%', right: '5%', fontSize: '2rem', animationDelay: '1s' }}>💧</div>
        <div className="hero-water-drop" style={{ bottom: '20%', right: '15%', fontSize: '2.5rem', animationDelay: '0.5s' }}>💧</div>
        <div className="hero-water-drop" style={{ top: '25%', left: '10%', fontSize: '1.8rem', animationDelay: '1.5s' }}>💧</div>
        <div className="hero-water-drop" style={{ bottom: '30%', left: '5%', fontSize: '2.2rem', animationDelay: '2s' }}>💧</div>
        <div className="container">
          <div className="hero-content">
            <AnimatedSection animation="fadeInUp" delay="0.1s">
              <div className="hero-badge"><span>✨</span> توصيل سريع في جميع أنحاء المملكة</div>
            </AnimatedSection>
            <AnimatedSection animation="fadeInUp" delay="0.25s">
              <h1>مياه نقية <span>لحياة أفضل</span></h1>
            </AnimatedSection>
            <AnimatedSection animation="fadeInUp" delay="0.4s">
              <p>استمتع بمياه شرب معبأة نقية وطبيعية، مع خدمة توصيل سريعة تصل إليك أينما كنت. اطلب الآن واحصل على خصم 20% على أول طلب!</p>
            </AnimatedSection>
            <AnimatedSection animation="fadeInUp" delay="0.55s">
              <div className="hero-buttons">
                <a href="#products" className="btn btn-primary btn-lg pulse-glow">اطلب الآن</a>
                <Link to="/register" className="btn btn-outline btn-lg">سجل واحصل على خصم</Link>
              </div>
            </AnimatedSection>
          </div>
          <div className="hero-visual">
            <AnimatedSection animation="scaleIn" delay="0.3s">
              <div className="hero-water float"><span>💧</span></div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: '🚚', title: 'توصيل سريع', desc: 'نوصل طلبك في أقل من 24 ساعة' },
              { icon: '💎', title: 'أفضل جودة', desc: 'مياه نقية وفق أعلى المعايير' },
              { icon: '🕐', title: 'خدمة 24/7', desc: 'دعم متواصل طوال أيام الأسبوع' },
              { icon: '💳', title: 'دفع آمن', desc: 'تابي، تمارا، بطاقة أو نقداً' },
            ].map((f, i) => (
              <AnimatedSection key={i} animation="fadeInUp" delay={`${0.1 + i * 0.1}s`}>
                <div className="feature-card">
                  <div className="feature-icon" style={{ animation: 'float 3s ease-in-out infinite', animationDelay: `${i * 0.5}s` }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section" id="products">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="section-header">
              <div className="divider"></div>
              <h2>منتجاتنا</h2>
              <p>اختر من بين مجموعتنا المتنوعة من منتجات المياه النقية</p>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fadeInUp" delay="0.15s">
            <div className="category-tabs">
              <button className={`cat-tab ${!cat ? 'active' : ''}`} onClick={() => setCat(null)}>الكل</button>
              {categories.map(c => (
                <button key={c.id} className={`cat-tab ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.name_ar}</button>
              ))}
            </div>
          </AnimatedSection>

          <div className="product-grid">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            {!loading && filtered.map((p, i) => (
              <AnimatedSection key={p.id} animation="fadeInUp" delay={`${Math.min(i * 0.06, 0.5)}s`}>
                <div className="product-card">
                  <Link to={`/product/${p.id}`}>
                    <div className="product-img">💧</div>
                  </Link>
                  <div className="product-body">
                    {(() => { const promo = getProductPromo(p); return promo ? <div className={`product-promo-tag${promo.type === 'percentage' ? ' perc' : ''}`}>{promoTag(promo)}</div> : null })()}
                    <Link to={`/product/${p.id}`}><h3>{p.name_ar}</h3></Link>
                    {p.size_liters && <div className="product-size">حجم: {p.size_liters} لتر</div>}
                    <div className="product-meta">
                      <div className="product-price">{parseFloat(p.price).toFixed(2)} <small>SAR</small></div>
                      <button className="btn btn-primary btn-sm btn-ripple" onClick={() => addToCart(p)}>أضف للسلة</button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <AnimatedSection animation="fadeInUp" delay="0s">
              <div className="about-image" style={{ animation: 'float 4s ease-in-out infinite' }}>💧</div>
            </AnimatedSection>
            <div className="about-content">
              <AnimatedSection animation="fadeInUp" delay="0.15s">
                <h2>لماذا تختار لمار؟</h2>
              </AnimatedSection>
              <AnimatedSection animation="fadeInUp" delay="0.25s">
                <p>نحن في لمار للمياه نلتزم بتقديم أفضل مياه شرب نقية لعملائنا. نستخدم أحدث تقنيات التنقية والتعبئة لضمان حصولك على مياه عالية الجودة في كل رشفة.</p>
              </AnimatedSection>
              <AnimatedSection animation="fadeInUp" delay="0.35s">
                <p>فريقنا المتخصص يعمل على مدار الساعة لضمان توصيل طلباتك في الوقت المحدد، مع الحفاظ على أعلى معايير الجودة والخدمة.</p>
              </AnimatedSection>
              <div className="about-stats">
                {[
                  { end: 5000, suffix: '+', label: 'عميل', decimals: 0 },
                  { end: 50, suffix: '+', label: 'مدينة', decimals: 0 },
                  { end: 99, suffix: '%', label: 'رضا العملاء', decimals: 0 },
                ].map((s, i) => (
                  <AnimatedSection key={i} animation="fadeInUp" delay={`${0.45 + i * 0.1}s`}>
                    <div className="about-stat">
                      <div className="about-stat-num"><CountUp end={s.end} suffix={s.suffix} duration={2000} decimals={s.decimals} /></div>
                      <div className="about-stat-label">{s.label}</div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="section-header">
              <div className="divider"></div>
              <h2>ماذا يقول عملاؤنا؟</h2>
              <p>آراء حقيقية من عملائنا الكرام</p>
            </div>
          </AnimatedSection>
          <AnimatedSection animation="fadeInUp" delay="0.2s">
            <div className="testimonial-carousel">
              <button className="carousel-btn carousel-btn-prev" onClick={() => setTSlide(s => (s - 1 + testimonials.length) % testimonials.length)}>‹</button>
              <button className="carousel-btn carousel-btn-next" onClick={() => setTSlide(s => (s + 1) % testimonials.length)}>›</button>
              <div className="testimonial-track" style={{ transform: `translateX(${tSlide * -100}%)` }}>
                {testimonials.map((t, i) => (
                  <div key={i} className="testimonial-slide">
                    <div className="testimonial-card" style={{ margin: '0 auto', maxWidth: '500px' }}>
                      <div className="testimonial-stars">{t.stars}</div>
                      <p className="testimonial-text">{t.text}</p>
                      <div className="testimonial-author">
                        <div className="testimonial-avatar">{t.initial}</div>
                        <div><div className="testimonial-name">{t.name}</div><div className="testimonial-title">{t.title}</div></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="carousel-dots">
                {testimonials.map((_, i) => (
                  <button key={i} className={`carousel-dot${i === tSlide ? ' active' : ''}`} onClick={() => setTSlide(i)} />
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <AnimatedSection animation="fadeInUp" delay="0s">
            <h2>اشترك الآن واستمتع بتوصيل مجاني</h2>
          </AnimatedSection>
          <AnimatedSection animation="fadeInUp" delay="0.15s">
            <p>أول طلب لك بخصم 20% + توصيل مجاني للمشتركين الجدد</p>
          </AnimatedSection>
          <AnimatedSection animation="fadeInUp" delay="0.3s">
            <div className="hero-buttons" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-white btn-lg pulse-glow">اشترك الآن</Link>
              <Link to="/cart" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: '#fff' }}>أبدا الطلب</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
