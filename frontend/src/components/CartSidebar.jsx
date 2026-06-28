import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CartSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState(JSON.parse(localStorage.getItem('cart') || '[]'))

  useEffect(() => {
    const update = () => setItems(JSON.parse(localStorage.getItem('cart') || '[]'))
    window.addEventListener('storage', update)
    window.addEventListener('cartUpdated', update)
    return () => { window.removeEventListener('storage', update); window.removeEventListener('cartUpdated', update) }
  }, [])

  function updateQty(id, delta) {
    const next = items.map(i => i.id === id ? { ...i, qty: Math.max(1, (i.qty || 1) + delta) } : i)
    localStorage.setItem('cart', JSON.stringify(next))
    setItems(next)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  function removeItem(id) {
    const next = items.filter(i => i.id !== id)
    localStorage.setItem('cart', JSON.stringify(next))
    setItems(next)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0)

  function handleCheckout() {
    onClose()
    if (user) navigate('/checkout')
    else navigate('/login')
  }

  return (
    <>
      <div className={`cart-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <div className={`cart-sidebar${isOpen ? ' open' : ''}`}>
        <div className="cart-sidebar-header">
          <h3>🛒 سلة التسوق</h3>
          <button className="cart-sidebar-close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-sidebar-items">
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛒</div>
              <p>السلة فارغة</p>
            </div>
          )}
          {items.map((item, i) => (
            <div key={item.id} className="cart-sidebar-item">
              <div className="cart-sidebar-item-img" style={{ background: '#f0ebf0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                💧
              </div>
              <div className="cart-sidebar-item-info">
                <strong>{item.name_ar}</strong>
                <small>{item.price.toFixed(2)} SAR</small>
              </div>
              <div className="cart-sidebar-item-qty">
                <button onClick={() => updateQty(item.id, -1)}>−</button>
                <span>{item.qty || 1}</span>
                <button onClick={() => updateQty(item.id, 1)}>+</button>
              </div>
              <button onClick={() => removeItem(item.id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger,#dc2626)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem' }}
                title="حذف">🗑️</button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="cart-sidebar-footer">
            <div className="cart-sidebar-total">
              <span>المجموع</span>
              <span>{subtotal.toFixed(2)} SAR</span>
            </div>
            <button className="btn btn-primary" onClick={handleCheckout}>إتمام الطلب</button>
          </div>
        )}
      </div>
    </>
  )
}
