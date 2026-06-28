import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPublicSettings } from '../api'

export default function Navbar({ onCartToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [banner, setBanner] = useState({})
  const [scrolled, setScrolled] = useState(false)
  const [badgeBounce, setBadgeBounce] = useState(false)
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'))

  useEffect(() => {
    const update = () => {
      const c = JSON.parse(localStorage.getItem('cart') || '[]')
      setCart(c)
      setBadgeBounce(true)
      setTimeout(() => setBadgeBounce(false), 400)
    }
    window.addEventListener('storage', update)
    window.addEventListener('cartUpdated', update)
    return () => { window.removeEventListener('storage', update); window.removeEventListener('cartUpdated', update) }
  }, [])

  useEffect(() => {
    getPublicSettings().then(d => {
      if (d?.[0]) setBanner(d[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function isActive(path) { return location.pathname === path ? 'active' : '' }

  function scrollToProducts(e) {
    e.preventDefault()
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 300) }
    else document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  const showBanner = banner.banner_enabled === '1' && banner.banner_text

  return (
    <>
      {showBanner && (
        <a href={banner.banner_link || '#'} className="top-banner">
          {banner.banner_text}
        </a>
      )}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-icon">💧</span>
            لمار
          </Link>
          <div className="navbar-links" style={{ display: menuOpen ? 'flex' : undefined }}>
            <Link to="/" className={isActive('/')}>الرئيسية</Link>
            <Link to="/about" className={isActive('/about')}>عن الشركة</Link>
            <Link to="/contact" className={isActive('/contact')}>تواصل معنا</Link>
            <a href="/#products" onClick={scrollToProducts}>المنتجات</a>
            {user && <Link to="/orders" className={isActive('/orders')}>طلباتي</Link>}
          </div>
          <div className="navbar-actions">
            {user ? (
              <>
                <Link to="/profile" className="btn btn-sm btn-outline">{user.name}</Link>
                <button className="btn btn-sm" onClick={() => { logout(); navigate('/') }}>خروج</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline">دخول</Link>
                <Link to="/register" className="btn btn-sm btn-primary">تسجيل</Link>
              </>
            )}
            <button onClick={onCartToggle} className="cart-badge" style={{ fontSize: '1.3rem', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              🛒
              {cart.length > 0 && <span className={`cart-count${badgeBounce ? ' cart-badge-bounce' : ''}`} style={{ position: 'absolute', top: '-6px', left: '-6px' }}>{cart.reduce((s, i) => s + (i.qty || 1), 0)}</span>}
            </button>
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </nav>
    </>
  )
}
