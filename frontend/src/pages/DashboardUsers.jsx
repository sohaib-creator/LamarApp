import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = ''

async function api(endpoint, opts = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${endpoint}`, { ...opts, headers })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

const ALL_PERMISSIONS = [
  { key: '*', label: 'الكل (صلاحية كاملة)' },
  { key: 'dashboard.view', label: 'عرض الإحصائيات' },
  { key: 'orders.view', label: 'عرض الطلبات' },
  { key: 'orders.update', label: 'تحديث الطلبات' },
  { key: 'products.view', label: 'عرض المنتجات' },
  { key: 'products.update', label: 'إدارة المنتجات' },
  { key: 'categories.view', label: 'عرض التصنيفات' },
  { key: 'categories.update', label: 'إدارة التصنيفات' },
  { key: 'users.view', label: 'عرض العملاء' },
  { key: 'users.update', label: 'إدارة العملاء' },
  { key: 'drivers.view', label: 'عرض المندوبين' },
  { key: 'drivers.update', label: 'إدارة المندوبين' },
  { key: 'reports.view', label: 'عرض التقارير' },
  { key: 'reviews.manage', label: 'إدارة التقييمات' },
  { key: 'marketing.manage', label: 'إدارة الأدوات التسويقية' },
  { key: 'payments.view', label: 'عرض وسائل الدفع' },
  { key: 'delivery.view', label: 'عرض مدن التوصيل' },
  { key: 'admin.users', label: 'إدارة المشرفين' },
  { key: 'settings.view', label: 'عرض الإعدادات' },
  { key: 'support.manage', label: 'إدارة الدعم الفني' },
]

export default function DashboardUsers() {
  const { can } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', permissions: [] })
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState(null)

  useEffect(() => { loadAdmins() }, [])

  async function loadAdmins() {
    setLoading(true)
    try {
      const data = await api('/api/admin/dashboard-users')
      setAdmins(Array.isArray(data) ? data : [])
    } catch { setAdmins([]) }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', permissions: [] })
    setFormMessage(null)
    setShowForm(true)
  }

  function openEdit(admin) {
    setEditing(admin)
    let perms = admin.permissions
    if (typeof perms === 'string') { try { perms = JSON.parse(perms) } catch { perms = [] } }
    if (!Array.isArray(perms)) perms = []
    setForm({ name: admin.name, email: admin.email, password: '', permissions: perms })
    setFormMessage(null)
    setShowForm(true)
  }

  function togglePerm(key) {
    setForm(prev => {
      const exists = prev.permissions.includes(key)
      if (key === '*') {
        return { ...prev, permissions: exists ? [] : ['*'] }
      }
      let updated = exists ? prev.permissions.filter(p => p !== key) : [...prev.permissions.filter(p => p !== '*'), key]
      return { ...prev, permissions: updated }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email) { setFormMessage('يرجى ملء الاسم والبريد الإلكتروني'); return }
    if (!editing && !form.password) { setFormMessage('يرجى إدخال كلمة المرور'); return }
    setSaving(true); setFormMessage(null)
    try {
      const body = { name: form.name, email: form.email, permissions: form.permissions }
      if (form.password) body.password = form.password
      if (editing) {
        await api('/api/admin/dashboard-users/' + editing.id, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await api('/api/admin/dashboard-users', { method: 'POST', body: JSON.stringify(body) })
      }
      setShowForm(false)
      setEditing(null)
      await loadAdmins()
    } catch (err) { setFormMessage(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) return
    try {
      await api('/api/admin/dashboard-users/' + id, { method: 'DELETE' })
      await loadAdmins()
    } catch (err) { alert(err.message) }
  }

  async function handleStatus(id, status) {
    try {
      await api('/api/admin/dashboard-users/' + id, { method: 'PUT', body: JSON.stringify({ status }) })
      setAdmins(admins.map(a => a.id === id ? { ...a, status } : a))
    } catch (err) { alert(err.message) }
  }

  function displayPerms(perms) {
    if (!perms) return '—'
    if (typeof perms === 'string') { try { perms = JSON.parse(perms) } catch { return perms } }
    if (!Array.isArray(perms)) return '—'
    if (perms.includes('*')) return 'صلاحية كاملة'
    return perms.length + ' صلاحية'
  }

  if (loading) return <div className="loading">جاري التحميل...</div>

  return (
    <div>
      <div className="page-header">
        <h1>👤 إدارة المشرفين</h1>
        {can('admin.users') && (
          <button className="btn btn-primary" onClick={openCreate}>➕ إضافة مشرف</button>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header" style={{ justifyContent: 'space-between' }}>
              <h3>{editing ? 'تعديل مشرف' : 'إضافة مشرف جديد'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>الاسم *</label>
              <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم المشرف" />
              <label>البريد الإلكتروني *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@example.com" />
              <label>{editing ? 'كلمة المرور (اترك فارغاً بدون تغيير)' : 'كلمة المرور *'}</label>
              <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="كلمة المرور" />
              <label>الصلاحيات</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
                {ALL_PERMISSIONS.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', padding: '4px 6px', borderRadius: 6, background: form.permissions.includes(p.key) ? '#eff6ff' : 'transparent' }}>
                    <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} style={{ accentColor: '#2563eb' }} />
                    {p.label}
                  </label>
                ))}
              </div>
              {formMessage && <div className="alert alert-danger" style={{ fontSize: 13 }}>{formMessage}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>#</th><th>الاسم</th><th>البريد</th><th>الصلاحيات</th><th>الحالة</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {admins.map((a, i) => {
                const isActive = a.status !== 'inactive' && a.status !== 'banned'
                return (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{a.email}</td>
                    <td style={{ fontSize: 12 }}>{displayPerms(a.permissions)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: isActive ? '#d1fae5' : '#fee2e2', color: isActive ? '#16a34a' : '#dc2626' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16a34a' : '#dc2626' }} />
                        {isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('ar-SA') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {can('admin.users') && (
                          <>
                            <button className="btn btn-sm btn-ghost" onClick={() => openEdit(a)}>✏️</button>
                            {isActive ? (
                              <button className="btn btn-sm btn-danger" onClick={() => handleStatus(a.id, 'inactive')}>⛔</button>
                            ) : (
                              <button className="btn btn-sm btn-success" onClick={() => handleStatus(a.id, 'active')}>✅</button>
                            )}
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {admins.length === 0 && <tr><td colSpan="7" className="text-center" style={{ color: '#94a3b8', padding: '2rem' }}>لا يوجد مشرفين</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
