import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDrivers, toggleUserStatus, createDriver, getOrders } from '../api'

const statusStyles = {
  active: { label: 'نشط', color: '#16a34a', bg: '#d1fae5' },
  inactive: { label: 'موقوف', color: '#dc2626', bg: '#fee2e2' },
  banned: { label: 'محظور', color: '#6b7280', bg: '#f3f4f6' },
}

export default function Drivers() {
  const { can } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState(null)

  useEffect(() => {
    getDrivers().then(setDrivers).catch(() => {})
    getOrders().then(setOrders).catch(() => {})
  }, [])

  async function handleStatus(id, status) {
    try { await toggleUserStatus(id, status); setDrivers(drivers.map(d => d.id === id ? { ...d, status } : d)) }
    catch (err) { alert(err.message) }
  }

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'active').length,
    inactive: drivers.filter(d => d.status === 'inactive' || d.status === 'banned').length,
  }

  const filtered = drivers.filter(d => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.phone?.toLowerCase().includes(q)
  })

  function handleFormChange(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setFormMessage('يرجى ملء الحقول المطلوبة'); return }
    setSaving(true); setFormMessage(null)
    try {
      await createDriver(form)
      setForm({ name: '', email: '', phone: '', password: '' })
      setShowForm(false)
      setFormMessage(null)
      const updated = await getDrivers()
      setDrivers(updated)
    } catch (err) { setFormMessage(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>🚛 إدارة المندوبين</h1>
        {can('drivers.update') && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ إضافة مندوب</button>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 470 }}>
            <div className="modal-header" style={{ justifyContent: 'space-between' }}>
              <h3>إضافة مندوب جديد</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>الاسم *</label>
              <input type="text" className="form-input" value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="اسم المندوب" />
              <label>البريد الإلكتروني *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => handleFormChange('email', e.target.value)} placeholder="driver@example.com" />
              <label>رقم الجوال</label>
              <input type="tel" className="form-input" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} placeholder="05xxxxxxxx" />
              <label>كلمة المرور *</label>
              <input type="password" className="form-input" value={form.password} onChange={e => handleFormChange('password', e.target.value)} placeholder="كلمة المرور" />
              {formMessage && <div className="alert alert-danger" style={{ fontSize: 13 }}>{formMessage}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mini-stats-row">
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>👥</div>
          <div><div className="mini-stat-value">{stats.total}</div><div className="mini-stat-label">إجمالي المندوبين</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#d1fae5', color: '#16a34a' }}>✅</div>
          <div><div className="mini-stat-value">{stats.active}</div><div className="mini-stat-label">نشط</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>⛔</div>
          <div><div className="mini-stat-value">{stats.inactive}</div><div className="mini-stat-label">غير نشط</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>📋</div>
          <div><div className="mini-stat-value">{orders.filter(o => o.driver_id && ['pending','confirmed','preparing','out_for_delivery'].includes(o.status)).length}</div><div className="mini-stat-label">توصيل حالياً</div></div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <input type="text" className="form-input" placeholder="🔍 بحث باسم المندوب أو البريد..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1 }} />
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>#</th><th>المندوب</th><th>البريد</th><th>الجوال</th><th>تاريخ التسجيل</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const st = statusStyles[d.status] || statusStyles.inactive
                const activeDeliveries = orders.filter(o => o.driver_id === d.id && ['pending','confirmed','preparing','out_for_delivery'].includes(o.status)).length
                return (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
                          {d.name?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{d.email}</td>
                    <td style={{ fontSize: 13 }}>{d.phone || '—'}</td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('ar-SA') : '—'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {can('drivers.update') && d.status === 'active' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleStatus(d.id, 'inactive')}>⛔ إيقاف</button>
                        )}
                        {can('drivers.update') && d.status !== 'active' && (
                          <button className="btn btn-sm btn-success" onClick={() => handleStatus(d.id, 'active')}>✅ تفعيل</button>
                        )}
                        {activeDeliveries > 0 && <span className="badge badge-info" style={{ fontSize: 11 }}>{activeDeliveries} توصيل</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan="7" className="text-center" style={{ color: '#94a3b8', padding: '2rem' }}>{searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد مندوبين'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
