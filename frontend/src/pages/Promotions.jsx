import { useState, useEffect, useRef } from 'react'

function DateInput({ value, onChange, placeholder = '01/12/2026' }) {
  const ref = useRef(null)
  return (
    <div style={{ position: 'relative' }}>
      <input type="text" className="promo-input" placeholder={placeholder}
        value={value ? value.split('-').reverse().join('/') : ''}
        onClick={() => ref.current?.showPicker()}
        onFocus={() => ref.current?.showPicker()}
        readOnly
        style={{ cursor: 'pointer', caretColor: 'transparent' }} />
      <input type="date" ref={ref}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}

const API = ''

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${endpoint}`, { ...options, headers })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

const tabs = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'scheduled', label: 'مجدول' },
  { key: 'expired', label: 'منتهي' },
]

const typeOptions = [
  { value: 'buy_x_get_y', label: 'اشتر X واحصل على Y مجاناً' },
  { value: 'percentage', label: 'خصم نسبة مئوية' },
]

const applicableOptions = [
  { value: 'all', label: 'جميع المنتجات' },
  { value: 'specific_product', label: 'منتج محدد' },
  { value: 'specific_category', label: 'تصنيف محدد' },
]

const emptyForm = {
  type: 'buy_x_get_y', title: '', description: '',
  buy_quantity: '', free_quantity: '',
  discount_percent: '', max_discount_amount: '', min_purchase: '',
  applicable_to: 'all', product_id: '', category_id: '',
  start_date: '', end_date: '', is_active: 1,
}

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [animOut, setAnimOut] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [p, pr, c] = await Promise.all([
        request('/api/promotions'),
        request('/api/products'),
        request('/api/categories'),
      ])
      setPromotions(p)
      setProducts(pr)
      setCategories(c)
    } catch { setError('فشل تحميل البيانات') }
  }

  const now = new Date()
  const filtered = promotions.filter(p => {
    const s = p.start_date ? new Date(p.start_date) : null
    const e = p.end_date ? new Date(p.end_date) : null
    if (activeTab === 'all') return true
    if (activeTab === 'active') return p.is_active && (!s || s <= now) && (!e || e >= now)
    if (activeTab === 'scheduled') return p.is_active && s && s > now
    if (activeTab === 'expired') return e && e < now || !p.is_active
    return true
  })

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => {
      const s = p.start_date ? new Date(p.start_date) : null
      const e = p.end_date ? new Date(p.end_date) : null
      return p.is_active && (!s || s <= now) && (!e || e >= now)
    }).length,
    expired: promotions.filter(p => {
      const e = p.end_date ? new Date(p.end_date) : null
      return (e && e < now) || !p.is_active
    }).length,
  }

  function getStatus(promo) {
    const s = promo.start_date ? new Date(promo.start_date) : null
    const e = promo.end_date ? new Date(promo.end_date) : null
    if (!promo.is_active) return { label: 'متوقف', color: '#94a3b8', bg: '#f1f5f9' }
    if (s && s > now) return { label: 'مجدول', color: '#f59e0b', bg: '#fef3c7' }
    if (e && e < now) return { label: 'منتهي', color: '#ef4444', bg: '#fee2e2' }
    return { label: 'نشط', color: '#10b981', bg: '#d1fae5' }
  }

  function openCreate() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setAnimOut(false)
    setShowForm(true)
    setError('')
  }

  function openEdit(promo) {
    setForm({
      type: promo.type, title: promo.title, description: promo.description || '',
      buy_quantity: promo.buy_quantity || '', free_quantity: promo.free_quantity || '',
      discount_percent: promo.discount_percent || '', max_discount_amount: promo.max_discount_amount || '',
      min_purchase: promo.min_purchase || '', applicable_to: promo.applicable_to || 'all',
      product_id: promo.product_id || '', category_id: promo.category_id || '',
      start_date: promo.start_date ? promo.start_date.split('T')[0] : '',
      end_date: promo.end_date ? promo.end_date.split('T')[0] : '',
      is_active: promo.is_active,
    })
    setEditingId(promo.id)
    setAnimOut(false)
    setShowForm(true)
    setError('')
  }

  function closeForm() {
    setAnimOut(true)
    setTimeout(() => setShowForm(false), 200)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        buy_quantity: form.type === 'buy_x_get_y' ? Number(form.buy_quantity) || 0 : null,
        free_quantity: form.type === 'buy_x_get_y' ? Number(form.free_quantity) || 0 : null,
        discount_percent: form.type === 'percentage' ? Number(form.discount_percent) || 0 : null,
        max_discount_amount: Number(form.max_discount_amount) || null,
        min_purchase: Number(form.min_purchase) || null,
        product_id: Number(form.product_id) || null,
        category_id: Number(form.category_id) || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
      }
      if (editingId) await request(`/api/promotions/${editingId}`, { method: 'PUT', body: JSON.stringify(body) })
      else await request('/api/promotions', { method: 'POST', body: JSON.stringify(body) })
      closeForm()
      loadAll()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('تأكيد حذف العرض؟')) return
    try { await request(`/api/promotions/${id}`, { method: 'DELETE' }); loadAll() }
    catch { setError('فشل الحذف') }
  }

  async function toggleActive(promo) {
    try {
      await request(`/api/promotions/${promo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...promo, is_active: promo.is_active ? 0 : 1 }),
      })
      loadAll()
    } catch { setError('فشل التحديث') }
  }

  return (
    <div className="page">
      <div className="promo-header">
        <div>
          <h1 className="promo-title">🎯 العروض والتخفيضات</h1>
          <p className="promo-subtitle">إدارة العروض الترويجية والتخفيضات على المنتجات</p>
        </div>
        <button className="promo-add-btn" onClick={openCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة عرض جديد
        </button>
      </div>

      {error && <div className="promo-toast">{error}<button onClick={() => setError('')}>✕</button></div>}

      <div className="promo-stats">
        <div className="promo-stat" style={{ '--stat-color': '#3b82f6' }}>
          <div className="promo-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📋</div>
          <div><div className="promo-stat-num">{stats.total}</div><div className="promo-stat-label">إجمالي العروض</div></div>
        </div>
        <div className="promo-stat" style={{ '--stat-color': '#10b981' }}>
          <div className="promo-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>✅</div>
          <div><div className="promo-stat-num">{stats.active}</div><div className="promo-stat-label">نشط حالياً</div></div>
        </div>
        <div className="promo-stat" style={{ '--stat-color': '#f59e0b' }}>
          <div className="promo-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>⏳</div>
          <div><div className="promo-stat-num">{promotions.filter(p => { const s=p.start_date?new Date(p.start_date):null; return p.is_active && s && s>now }).length}</div><div className="promo-stat-label">مجدول</div></div>
        </div>
        <div className="promo-stat" style={{ '--stat-color': '#ef4444' }}>
          <div className="promo-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>⏰</div>
          <div><div className="promo-stat-num">{stats.expired}</div><div className="promo-stat-label">منتهي</div></div>
        </div>
      </div>

      <div className="promo-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`promo-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
            {t.key !== 'all' && <span className="promo-tab-count">{t.key === 'active' ? stats.active : t.key === 'expired' ? stats.expired : promotions.filter(p => { const s=p.start_date?new Date(p.start_date):null; return p.is_active && s && s>now }).length}</span>}
          </button>
        ))}
      </div>

      {showForm && (
        <div className={`promo-overlay ${animOut ? 'fade-out' : ''}`} onClick={closeForm}>
          <div className={`promo-modal ${animOut ? 'slide-down' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="promo-modal-header">
              <h3>{editingId ? '✏️ تعديل العرض' : '🎯 إضافة عرض جديد'}</h3>
              <button className="promo-modal-close" onClick={closeForm}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="promo-form">
              <div className="promo-form-row">
                <div className="promo-field">
                  <label>نوع العرض <span className="required">*</span></label>
                  <div className="promo-type-select">
                    {typeOptions.map(o => (
                      <button key={o.value} type="button"
                        className={`promo-type-option ${form.type === o.value ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, type: o.value })}>
                        <span className="promo-type-emoji">{o.value === 'buy_x_get_y' ? '🎁' : '🏷️'}</span>
                        <span>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="promo-form-row">
                <div className="promo-field">
                  <label>عنوان العرض <span className="required">*</span></label>
                  <input className="promo-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: عرض رمضان المبارك" required />
                </div>
                <div className="promo-field">
                  <label>وصف العرض</label>
                  <input className="promo-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="وصف مختصر للعرض" />
                </div>
              </div>

              <div className="promo-conditional-card">
                <div className="promo-conditional-icon">
                  {form.type === 'buy_x_get_y' ? '🎁' : '💰'}
                </div>
                <div className="promo-conditional-fields">
                  {form.type === 'buy_x_get_y' ? (
                    <div className="promo-form-row">
                      <div className="promo-field">
                        <label>كمية الشراء <span className="required">*</span></label>
                        <div className="promo-input-group">
                          <input type="number" min="1" className="promo-input" value={form.buy_quantity}
                            onChange={e => setForm({ ...form, buy_quantity: e.target.value })} placeholder="10" required />
                          <span className="promo-input-suffix">وحدة</span>
                        </div>
                      </div>
                      <div className="promo-field">
                        <label>الكمية المجانية <span className="required">*</span></label>
                        <div className="promo-input-group">
                          <input type="number" min="1" className="promo-input" value={form.free_quantity}
                            onChange={e => setForm({ ...form, free_quantity: e.target.value })} placeholder="2" required />
                          <span className="promo-input-suffix">وحدة</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="promo-form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                      <div className="promo-field">
                        <label>نسبة الخصم <span className="required">*</span></label>
                        <div className="promo-input-group">
                          <input type="number" min="1" max="100" className="promo-input" value={form.discount_percent}
                            onChange={e => setForm({ ...form, discount_percent: e.target.value })} placeholder="20" required />
                          <span className="promo-input-suffix">%</span>
                        </div>
                      </div>
                      <div className="promo-field">
                        <label>الحد الأقصى</label>
                        <div className="promo-input-group">
                          <input type="number" min="0" className="promo-input" value={form.max_discount_amount}
                            onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="50" />
                          <span className="promo-input-suffix">ريال</span>
                        </div>
                      </div>
                      <div className="promo-field">
                        <label>أقل مبلغ للطلب</label>
                        <div className="promo-input-group">
                          <input type="number" min="0" className="promo-input" value={form.min_purchase}
                            onChange={e => setForm({ ...form, min_purchase: e.target.value })} placeholder="100" />
                          <span className="promo-input-suffix">ريال</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="promo-applicable">
                <label className="promo-field-label">ينطبق على</label>
                <div className="promo-applicable-options">
                  {applicableOptions.map(o => (
                    <label key={o.value} className={`promo-applicable-option ${form.applicable_to === o.value ? 'selected' : ''}`}>
                      <input type="radio" name="applicable_to" value={o.value}
                        checked={form.applicable_to === o.value}
                        onChange={e => setForm({ ...form, applicable_to: e.target.value })} />
                      <span className="promo-radio-dot" />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
                {form.applicable_to === 'specific_product' && (
                  <select className="promo-input" style={{ marginTop: '0.6rem' }}
                    value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                    <option value="">اختر منتجاً</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
                  </select>
                )}
                {form.applicable_to === 'specific_category' && (
                  <select className="promo-input" style={{ marginTop: '0.6rem' }}
                    value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">اختر تصنيفاً</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                  </select>
                )}
              </div>

              <div className="promo-dates">
                <label className="promo-field-label">مدة العرض (اختياري)</label>
                <div className="promo-form-row">
                  <div className="promo-field">
                    <label>تاريخ البداية</label>
                    <DateInput value={form.start_date} onChange={v => setForm({ ...form, start_date: v })} />
                  </div>
                  <div className="promo-field">
                    <label>تاريخ النهاية</label>
                    <DateInput value={form.end_date} onChange={v => setForm({ ...form, end_date: v })} />
                  </div>
                </div>
                {!form.start_date && !form.end_date && <p className="promo-date-hint">بدون تاريخ = عرض دائم</p>}
              </div>

              <div className="promo-form-actions">
                <button type="button" className="promo-btn promo-btn-secondary" onClick={closeForm}>إلغاء</button>
                <button type="submit" className="promo-btn promo-btn-primary" disabled={saving}>
                  {saving && <span className="spinner" />}
                  {saving ? 'جاري الحفظ...' : editingId ? 'تحديث العرض' : 'إضافة العرض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="promo-empty">
          <div className="promo-empty-icon">🎯</div>
          <h3>لا توجد عروض</h3>
          <p>لم يتم إضافة أي عروض بعد. أضف عرضك الأول الآن!</p>
          <button className="promo-add-btn" onClick={openCreate} style={{ marginTop: '1rem' }}>+ إضافة عرض</button>
        </div>
      ) : (
        <div className="promo-grid">
          {filtered.map(p => {
            const status = getStatus(p)
            const isExpired = status.label === 'منتهي' || status.label === 'متوقف'
            return (
              <div key={p.id} className={`promo-card ${isExpired ? 'expired' : ''}`}>
                <div className="promo-card-accent" style={{
                  background: p.type === 'buy_x_get_y'
                    ? 'linear-gradient(135deg, #a855f7, #d946ef)'
                    : 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                }} />

                <div className="promo-card-body">
                  <div className="promo-card-top">
                    <div className="promo-card-type">
                      <span className="promo-type-badge" style={{
                        background: p.type === 'buy_x_get_y' ? '#f3e8ff' : '#dbeafe',
                        color: p.type === 'buy_x_get_y' ? '#7c3aed' : '#2563eb',
                      }}>
                        {p.type === 'buy_x_get_y' ? '🎁 اشتر X + Y مجاني' : '🏷️ خصم %'}
                      </span>
                      <span className="promo-status-dot" style={{ background: status.color }}>
                        <span className="promo-status-pulse" style={{ background: status.color }} />
                        {status.label}
                      </span>
                    </div>
                    <label className="promo-toggle" onClick={() => toggleActive(p)}>
                      <input type="checkbox" checked={p.is_active === 1} readOnly />
                      <span className="promo-toggle-track">
                        <span className="promo-toggle-thumb" />
                      </span>
                    </label>
                  </div>

                  <h3 className="promo-card-title">{p.title}</h3>
                  {p.description && <p className="promo-card-desc">{p.description}</p>}

                  <div className="promo-card-details">
                    {p.type === 'buy_x_get_y' ? (
                      <div className="promo-offer-display">
                        <div className="promo-offer-block buy">
                          <span className="promo-offer-num">{p.buy_quantity}</span>
                          <span className="promo-offer-text">شراء</span>
                        </div>
                        <div className="promo-offer-plus">+</div>
                        <div className="promo-offer-block free">
                          <span className="promo-offer-num">{p.free_quantity}</span>
                          <span className="promo-offer-text">مجاناً</span>
                        </div>
                      </div>
                    ) : (
                      <div className="promo-percent-display">
                        <span className="promo-percent-big">{p.discount_percent}%</span>
                        <span className="promo-percent-label">خصم</span>
                        {p.max_discount_amount ? <span className="promo-percent-limit">حد أقصى {p.max_discount_amount} ريال</span> : null}
                        {p.min_purchase ? <span className="promo-percent-limit">أقل فاتورة {p.min_purchase} ريال</span> : null}
                      </div>
                    )}
                  </div>

                  <div className="promo-card-meta">
                    <span className="promo-meta-item">
                      {p.applicable_to === 'all' ? '📦 جميع المنتجات'
                        : p.applicable_to === 'specific_product' ? `📌 ${p.product_name || 'منتج محدد'}`
                        : `📂 ${p.category_name || 'تصنيف محدد'}`}
                    </span>
                    <span className="promo-meta-item">
                      {p.start_date || p.end_date
                        ? `📅 ${p.start_date || '—'} → ${p.end_date || '—'}`
                        : '♾️ عرض دائم'}
                    </span>
                  </div>

                  <div className="promo-card-actions">
                    <button className="promo-action-btn edit" onClick={() => openEdit(p)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      تعديل
                    </button>
                    <button className="promo-action-btn delete" onClick={() => handleDelete(p.id)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
