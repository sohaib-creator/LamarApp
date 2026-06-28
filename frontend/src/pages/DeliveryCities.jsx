import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDeliveryCities, addDeliveryCity, toggleDeliveryCity, deleteDeliveryCity } from '../api'

export default function DeliveryCities() {
  const { can } = useAuth()
  const [cities, setCities] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')

  function load() { getDeliveryCities().then(setCities).catch(() => {}) }
  useEffect(() => { load() }, [])

  async function handleToggle(id, current) {
    try { await toggleDeliveryCity(id, current ? 0 : 1); load() }
    catch (err) { alert(err.message) }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await addDeliveryCity(newName.trim())
      setNewName(''); setShowForm(false); load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('تأكيد الحذف؟')) return
    try { await deleteDeliveryCity(id); load() } catch (err) { alert(err.message) }
  }

  const activeCount = cities.filter(c => c.is_active).length

  return (
    <div>
      <div className="page-header">
        <h1>🏙️ مدن التوصيل</h1>
        {can('delivery.update') && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ إلغاء' : '+ إضافة مدينة'}
        </button>}
      </div>

      <div className="mini-stats-row" style={{ marginBottom: '1rem' }}>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>🏙️</div>
          <div><div className="mini-stat-value">{cities.length}</div><div className="mini-stat-label">إجمالي المدن</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#d1fae5', color: '#16a34a' }}>✅</div>
          <div><div className="mini-stat-value">{activeCount}</div><div className="mini-stat-label">نشط</div></div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>⛔</div>
          <div><div className="mini-stat-value">{cities.length - activeCount}</div><div className="mini-stat-label">غير نشط</div></div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16, padding: '1rem' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>اسم المدينة</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: رابغ" required />
            </div>
            <button type="submit" className="btn btn-primary">➕ إضافة</button>
            <button type="button" className="btn" onClick={() => { setShowForm(false); setNewName('') }}>إلغاء</button>
          </form>
        </div>
      )}

      <div className="card">
        {cities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏙️</div>
            <p>لا توجد مدن توصيل بعد</p>
            {can('delivery.update') && <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowForm(true)}>+ إضافة مدينة</button>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>المدينة</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>
                {cities.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.name_ar}</td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{c.sort_order || '-'}</td>
                    <td>
                      {can('delivery.update') ? (
                        <label className="toggle" style={{ margin: 0 }}>
                          <input type="checkbox" checked={!!c.is_active} onChange={() => handleToggle(c.id, c.is_active)} />
                          <span className="toggle-slider"></span>
                        </label>
                      ) : (
                        <span className={`badge badge-${c.is_active ? 'success' : 'secondary'}`}>
                          {c.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      )}
                    </td>
                    <td>
                      {can('delivery.update') && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          🗑️ حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
