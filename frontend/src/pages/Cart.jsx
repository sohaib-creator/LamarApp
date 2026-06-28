import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

export default function Cart() {
  const [items, setItems] = useState(JSON.parse(localStorage.getItem('cart') || '[]'))

  useEffect(() => {
    const update = () => setItems(JSON.parse(localStorage.getItem('cart') || '[]'))
    window.addEventListener('storage', update)
    window.addEventListener('cartUpdated', update)
    return () => { window.removeEventListener('storage', update); window.removeEventListener('cartUpdated', update) }
  }, [])

  function update(id, delta) {
    const next = items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    setItems(next); localStorage.setItem('cart', JSON.stringify(next)); window.dispatchEvent(new Event('cartUpdated'))
  }
  function remove(id) {
    const next = items.filter(i => i.id !== id)
    setItems(next); localStorage.setItem('cart', JSON.stringify(next)); window.dispatchEvent(new Event('cartUpdated'))
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  if (items.length === 0) return (
    <div className="empty-state page-transition">
      <div className="empty-icon">🛒</div>
      <h2>السلة فارغة</h2>
      <p>أضف منتجات إلى سلة المشتريات وعد إلينا</p>
      <Link to="/" className="btn btn-primary btn-lg">تصفح المنتجات</Link>
    </div>
  )

  return (
    <div className="cart-page page-transition">
      <h2>سلة المشتريات</h2>
      {items.map((i, idx) => (
        <AnimatedSection key={i.id} animation="fadeInUp" delay={`${idx * 0.08}s`}>
          <div className="cart-item">
            <div>
              <div style={{ fontWeight: 700 }}>{i.name_ar}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{i.price} SAR × {i.qty} = <strong style={{ color: 'var(--primary)' }}>{(i.price * i.qty).toFixed(2)} SAR</strong></div>
            </div>
            <div className="cart-controls">
              <button className="btn btn-outline btn-ripple" onClick={() => update(i.id, -1)}>-</button>
              <span>{i.qty}</span>
              <button className="btn btn-primary btn-ripple" onClick={() => update(i.id, 1)}>+</button>
              <button className="btn btn-ripple" onClick={() => remove(i.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}>✕</button>
            </div>
          </div>
        </AnimatedSection>
      ))}
      <AnimatedSection animation="fadeInUp" delay="0.3s">
        <div className="cart-total"><h3>الإجمالي: {total.toFixed(2)} SAR</h3></div>
        <Link to="/checkout" className="btn btn-primary btn-block btn-lg btn-ripple">متابعة الشراء</Link>
      </AnimatedSection>
    </div>
  )
}
