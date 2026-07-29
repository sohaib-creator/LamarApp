import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicSettings } from '../api'

const socialIcons = {
  social_whatsapp: <img src="/images/social-whatsapp.svg" alt="WhatsApp" style={{width:24,height:24}} />,
  social_twitter: <img src="/images/social-x.svg" alt="Twitter" style={{width:24,height:24}} />,
  social_instagram: <img src="/images/social-instagram.svg" alt="Instagram" style={{width:24,height:24}} />,
  social_snapchat: <img src="/images/social-snapchat.svg" alt="Snapchat" style={{width:24,height:24}} />,
  social_facebook: <img src="/images/social-facebook.svg" alt="Facebook" style={{width:24,height:24}} />,
  social_tiktok: <img src="/images/social-tiktok.svg" alt="TikTok" style={{width:24,height:24}} />,
}

export default function Footer() {
  const [social, setSocial] = useState({})

  useEffect(() => {
    getPublicSettings().then(d => {
      if (d?.[0]) setSocial(d[0])
    }).catch(() => {})
  }, [])

  const socialLinks = Object.keys(socialIcons)
    .filter(k => social[k])
    .map(k => ({ key: k, icon: socialIcons[k], url: social[k] }))

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="navbar-logo">
              <span className="navbar-logo-icon"><img src="/images/logo.svg" alt="Lamar" style={{width:28,height:28}} /></span>
              لمار
            </div>
            <p>شركة لمار للمياه - نوفر أفضل مياه شرب نقية مع خدمة توصيل سريعة في جميع أنحاء المملكة العربية السعودية.</p>
            <div className="footer-social">
              {socialLinks.map(s => (
                <a key={s.key} href={s.url} target="_blank" rel="noopener" aria-label={s.key}>{s.icon}</a>
              ))}
            </div>
          </div>
          <div>
            <h4>روابط سريعة</h4>
            <ul>
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/about">عن الشركة</Link></li>
              <li><Link to="/contact">تواصل معنا</Link></li>
              <li><a href="/#products">المنتجات</a></li>
            </ul>
          </div>
          <div>
            <h4>خدماتنا</h4>
            <ul>
              <li><a href="/#products">توصيل للمنازل</a></li>
              <li><a href="/#products">توصيل للشركات</a></li>
              <li><a href="/#products">طلبات الجملة</a></li>
              <li><a href="/#products">اشتراك شهري</a></li>
            </ul>
          </div>
          <div>
            <h4>معلومات التواصل</h4>
            <ul>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><img src="/images/telephone.svg" alt="" style={{width:16,height:16}} /> 9200XXXXX</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><img src="/images/envelope.svg" alt="" style={{width:16,height:16}} /> info@lamar-water.com</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><img src="/images/geo-alt.svg" alt="" style={{width:16,height:16}} /> الرياض، المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 لمار للمياه - جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  )
}
