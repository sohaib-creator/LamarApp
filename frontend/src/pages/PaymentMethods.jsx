import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPaymentMethods, togglePaymentMethod } from '../api'

const methodIcons = {
  cash: '💵',
  card: '💳',
  tabby: '🐾',
  tamara: '🦋',
  wallet: '👛',
  bank: '🏦',
  applepay: '🍎',
  stcpay: '📱',
}

const methodColors = {
  cash: { bg: '#d1fae5', color: '#059669' },
  card: { bg: '#dbeafe', color: '#2563eb' },
  tabby: { bg: '#f3e8ff', color: '#7c3aed' },
  tamara: { bg: '#fce7f3', color: '#db2777' },
}

export default function PaymentMethods() {
  const { can } = useAuth()
  const [methods, setMethods] = useState([])

  function load() { getPaymentMethods().then(setMethods).catch(() => {}) }
  useEffect(() => { load() }, [])

  async function handleToggle(id, current) {
    try { await togglePaymentMethod(id, current ? 0 : 1); load() }
    catch (err) { alert(err.message) }
  }

  const activeCount = methods.filter(m => m.is_active).length

  return (
    <div>
      <div className="page-header">
        <h1>💳 وسائل الدفع</h1>
      </div>

      <div className="mini-stats-row" style={{ marginBottom: '1rem' }}>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>💳</div>
          <div><div className="mini-stat-value">{methods.length}</div><div className="mini-stat-label">إجمالي الوسائل</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#d1fae5', color: '#16a34a' }}>✅</div>
          <div><div className="mini-stat-value">{activeCount}</div><div className="mini-stat-label">مفعلة</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>⛔</div>
          <div><div className="mini-stat-value">{methods.length - activeCount}</div><div className="mini-stat-label">معطلة</div></div>
        </div>
      </div>

      <div className="card">
        {methods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
            <p>لا توجد وسائل دفع</p>
          </div>
        ) : (
          <div className="pm-grid">
            {methods.map(m => {
              const mc = methodColors[m.name_slug] || { bg: '#f1f5f9', color: '#64748b' }
              return (
                <div key={m.id} className={`pm-card ${m.is_active ? '' : 'disabled'}`}>
                  <div className="pm-card-top">
                    <div className="pm-icon" style={{ background: mc.bg, color: mc.color }}>
                      {methodIcons[m.name_slug] || '💳'}
                    </div>
                    <div className="pm-info">
                      <div className="pm-name">{m.display_name_ar}</div>
                      <div className="pm-slug">{m.name_slug}</div>
                    </div>
                    <label className="toggle" style={{ marginRight: 'auto' }}>
                      <input type="checkbox" checked={!!m.is_active} onChange={() => handleToggle(m.id, m.is_active)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="pm-card-bottom">
                    <span className="pm-sort">الترتيب: {m.sort_order || '-'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .pm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
        .pm-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; transition: all 0.2s; }
        .pm-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .pm-card.disabled { opacity: 0.55; }
        .pm-card-top { display: flex; align-items: center; gap: 0.75rem; }
        .pm-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
        .pm-info { flex: 1; }
        .pm-name { font-weight: 700; font-size: 0.95rem; }
        .pm-slug { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem; }
        .pm-card-bottom { margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
        .pm-sort { font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </div>
  )
}
