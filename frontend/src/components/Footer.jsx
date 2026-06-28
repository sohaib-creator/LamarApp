import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicSettings } from '../api'

const socialIcons = {
  social_whatsapp: '📱',
  social_twitter: '𝕏',
  social_instagram: '📷',
  social_snapchat: '👻',
  social_facebook: '📘',
  social_tiktok: '🎵',
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
              <span className="navbar-logo-icon">💧</span>
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
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>📞 9200XXXXX</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>✉️ info@lamar-water.com</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>📍 الرياض، المملكة العربية السعودية</li>
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
