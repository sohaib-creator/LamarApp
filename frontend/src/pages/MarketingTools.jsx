import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import DateInput from '../components/DateInput'

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

const pageTabs = [
  { key: 'promotions', label: 'العروض', icon: '🎯', desc: 'إدارة العروض الترويجية والتخفيضات' },
  { key: 'ads', label: 'الإعلانات', icon: '📢', desc: 'إعلان الشريط العلوي وأكواد التتبع Pixel' },
  { key: 'discount_codes', label: 'أكواد الخصم', icon: '🏷️', desc: 'إنشاء وإدارة أكواد الخصم للعملاء' },
]

const promoFilterTabs = [
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
const emptyPromoForm = {
  type: 'buy_x_get_y', title: '', description: '',
  buy_quantity: '', free_quantity: '',
  discount_percent: '', max_discount_amount: '', min_purchase: '',
  applicable_to: 'all', product_id: '', category_id: '',
  start_date: '', end_date: '', is_active: 1,
}

const emptyCodeForm = {
  code: '', discount_type: 'percentage', discount_value: '',
  max_uses: '', min_purchase: '', expires_at: '', is_active: 1,
}
const discountTypeOptions = [
  { value: 'percentage', label: 'نسبة مئوية %' },
  { value: 'fixed', label: 'قيمة ثابتة (SAR)' },
]

export default function MarketingTools() {
  const { can } = useAuth()
  const [activeTab, setActiveTab] = useState('promotions')

  if (!can('marketing.manage')) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><p>ليس لديك صلاحية الوصول لهذه الصفحة</p></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📣 الأدوات التسويقية</h1>
      </div>

      <div className="mkt-tabs">
        {pageTabs.map(t => (
          <button key={t.key}
            className={`mkt-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            <span className="mkt-tab-icon">{t.icon}</span>
            <span className="mkt-tab-label">{t.label}</span>
            <span className="mkt-tab-desc">{t.desc}</span>
          </button>
        ))}
      </div>

      {activeTab === 'promotions' && <PromotionsSection can={can} />}
      {activeTab === 'ads' && <AdsSection can={can} />}
      {activeTab === 'discount_codes' && <DiscountCodesSection can={can} />}
    </div>
  )
}

function PromotionsSection({ can }) {
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ ...emptyPromoForm })
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

  function openCreate() { setForm({ ...emptyPromoForm }); setEditingId(null); setAnimOut(false); setShowForm(true); setError('') }
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
    setEditingId(promo.id); setAnimOut(false); setShowForm(true); setError('')
  }
  function closeForm() { setAnimOut(true); setTimeout(() => setShowForm(false), 200) }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
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
      closeForm(); loadAll()
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
      await request(`/api/promotions/${promo.id}`, { method: 'PUT', body: JSON.stringify({ ...promo, is_active: promo.is_active ? 0 : 1 }) })
      loadAll()
    } catch { setError('فشل التحديث') }
  }

  return (
    <div>
      <div className="promo-header">
        <div>
          <p className="promo-subtitle">إدارة العروض الترويجية والتخفيضات على المنتجات</p>
        </div>
          {can('marketing.manage') && (
            <button className="promo-add-btn" onClick={openCreate}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              إضافة عرض جديد
            </button>
          )}
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
        {promoFilterTabs.map(t => (
          <button key={t.key} className={`promo-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
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
                  <input className="promo-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: عرض رمضان المبارك" required />
                </div>
                <div className="promo-field">
                  <label>وصف العرض</label>
                  <input className="promo-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف مختصر للعرض" />
                </div>
              </div>
              <div className="promo-conditional-card">
                <div className="promo-conditional-icon">{form.type === 'buy_x_get_y' ? '🎁' : '💰'}</div>
                <div className="promo-conditional-fields">
                  {form.type === 'buy_x_get_y' ? (
                    <div className="promo-form-row">
                      <div className="promo-field">
                        <label>كمية الشراء <span className="required">*</span></label>
                        <div className="promo-input-group">
                          <input type="number" min="1" className="promo-input" value={form.buy_quantity} onChange={e => setForm({ ...form, buy_quantity: e.target.value })} placeholder="10" required />
                          <span className="promo-input-suffix">وحدة</span>
                        </div>
                      </div>
                      <div className="promo-field">
                        <label>الكمية المجانية <span className="required">*</span></label>
                        <div className="promo-input-group">
                          <input type="number" min="1" className="promo-input" value={form.free_quantity} onChange={e => setForm({ ...form, free_quantity: e.target.value })} placeholder="2" required />
                          <span className="promo-input-suffix">وحدة</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="promo-form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                      <div className="promo-field">
                        <label>نسبة الخصم <span className="required">*</span></label>
                        <div className="promo-input-group">
                          <input type="number" min="1" max="100" className="promo-input" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} placeholder="20" required />
                          <span className="promo-input-suffix">%</span>
                        </div>
                      </div>
                      <div className="promo-field">
                        <label>الحد الأقصى</label>
                        <div className="promo-input-group">
                          <input type="number" min="0" className="promo-input" value={form.max_discount_amount} onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="50" />
                          <span className="promo-input-suffix">ريال</span>
                        </div>
                      </div>
                      <div className="promo-field">
                        <label>أقل مبلغ للطلب</label>
                        <div className="promo-input-group">
                          <input type="number" min="0" className="promo-input" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: e.target.value })} placeholder="100" />
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
                      <input type="radio" name="applicable_to" value={o.value} checked={form.applicable_to === o.value} onChange={e => setForm({ ...form, applicable_to: e.target.value })} />
                      <span className="promo-radio-dot" />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
                {form.applicable_to === 'specific_product' && (
                  <select className="promo-input" style={{ marginTop: '0.6rem' }} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                    <option value="">اختر منتجاً</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
                  </select>
                )}
                {form.applicable_to === 'specific_category' && (
                  <select className="promo-input" style={{ marginTop: '0.6rem' }} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
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
          {can('marketing.manage') && <button className="promo-add-btn" onClick={openCreate} style={{ marginTop: '1rem' }}>+ إضافة عرض</button>}
        </div>
      ) : (
        <div className="promo-grid">
          {filtered.map(p => {
            const status = getStatus(p)
            const isExpired = status.label === 'منتهي' || status.label === 'متوقف'
            return (
              <div key={p.id} className={`promo-card ${isExpired ? 'expired' : ''}`}>
                <div className="promo-card-accent" style={{
                  background: p.type === 'buy_x_get_y' ? 'linear-gradient(135deg, #a855f7, #d946ef)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)'
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
                      <span className="promo-status-dot" style={{ background: status.bg, color: status.color }}>
                        <span className="promo-status-pulse" style={{ background: status.color }} />
                        {status.label}
                      </span>
                    </div>
                    {can('marketing.manage') ? (
                      <label className="promo-toggle" onClick={() => toggleActive(p)}>
                        <input type="checkbox" checked={p.is_active === 1} readOnly />
                        <span className="promo-toggle-track"><span className="promo-toggle-thumb" /></span>
                      </label>
                    ) : (
                      <span className={`badge badge-${p.is_active ? 'success' : 'secondary'}`}>{p.is_active ? 'نشط' : 'متوقف'}</span>
                    )}
                  </div>
                  <h3 className="promo-card-title">{p.title}</h3>
                  {p.description && <p className="promo-card-desc">{p.description}</p>}
                  <div className="promo-card-details">
                    {p.type === 'buy_x_get_y' ? (
                      <div className="promo-offer-display">
                        <div className="promo-offer-block buy"><span className="promo-offer-num">{p.buy_quantity}</span><span className="promo-offer-text">شراء</span></div>
                        <div className="promo-offer-plus">+</div>
                        <div className="promo-offer-block free"><span className="promo-offer-num">{p.free_quantity}</span><span className="promo-offer-text">مجاناً</span></div>
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
                      {p.applicable_to === 'all' ? '📦 جميع المنتجات' : p.applicable_to === 'specific_product' ? `📌 ${p.product_name || 'منتج محدد'}` : `📂 ${p.category_name || 'تصنيف محدد'}`}
                    </span>
                    <span className="promo-meta-item">
                      {p.start_date || p.end_date ? `📅 ${p.start_date || '—'} → ${p.end_date || '—'}` : '♾️ عرض دائم'}
                    </span>
                  </div>
                  <div className="promo-card-actions">
                    {can('marketing.manage') && (
                      <button className="promo-action-btn edit" onClick={() => openEdit(p)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        تعديل
                      </button>
                    )}
                    {can('marketing.manage') && (
                      <button className="promo-action-btn delete" onClick={() => handleDelete(p.id)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        حذف
                      </button>
                    )}
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

function AdsSection({ can }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await request('/api/admin/settings')
      if (data?.[0]) setSettings(data[0])
    } catch {} finally { setLoading(false) }
  }

  async function save(key, value) {
    setSaving(true); setMsg({ text: '', type: '' })
    try {
      await request('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value: String(value) }) })
      setSettings(prev => ({ ...prev, [key]: String(value) }))
      setMsg({ text: '✓ تم حفظ الإعداد', type: 'success' })
    } catch (e) { setMsg({ text: '✗ ' + e.message, type: 'error' }) }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    setSaving(false)
  }

  async function saveGroup(keys) {
    setSaving(true); setMsg({ text: '', type: '' })
    try {
      for (const key of keys) {
        await request('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value: String(settings[key] || '') }) })
      }
      setMsg({ text: '✓ تم حفظ جميع الإعدادات', type: 'success' })
    } catch (e) { setMsg({ text: '✗ ' + e.message, type: 'error' }) }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    setSaving(false)
  }

  function setVal(key, val) { setSettings(prev => ({ ...prev, [key]: val })) }

  if (loading) return <div className="loading">جاري التحميل...</div>

  return (
    <div className="card" style={{ padding: '1.5rem 2rem' }}>
      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>إعلان الشريط العلوي</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>يظهر أعلى الموقع (فوق النافبار)</p>
        </div>
        {can('marketing.manage') ? (
          <label className="toggle">
            <input type="checkbox" checked={settings.banner_enabled === '1'} onChange={e => save('banner_enabled', e.target.checked ? '1' : '0')} />
            <span className="toggle-slider"></span>
          </label>
        ) : (
          <span className={`badge badge-${settings.banner_enabled === '1' ? 'success' : 'secondary'}`}>{settings.banner_enabled === '1' ? 'مفعل' : 'معطل'}</span>
        )}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>نص الإعلان</label>
        <input type="text" className="form-input" style={{ width: '100%' }} value={settings.banner_text || ''}
          placeholder="مثال: 🎉 توصيل مجاني للطلبات فوق 120 ريال" onChange={e => setVal('banner_text', e.target.value)} readOnly={!can('marketing.manage')} />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>رابط الإعلان (اختياري)</label>
        <input type="text" className="form-input" style={{ width: '100%' }} value={settings.banner_link || ''}
          placeholder="/products" onChange={e => setVal('banner_link', e.target.value)} readOnly={!can('marketing.manage')} />
      </div>

      {can('marketing.manage') && (
        <button className="btn btn-primary" style={{ marginBottom: '2rem' }} onClick={() => saveGroup(['banner_text', 'banner_link'])} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ الإعلان'}
        </button>
      )}

      <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>🔍 أكواد التتبع (Pixel)</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>أدخل رقم البكسل أو معرف الإعلان فقط والنظام سيولد الكود تلقائياً</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { key: 'pixel_facebook', label: 'فيسبوك Pixel', icon: '📘', placeholder: '1234567890' },
          { key: 'pixel_tiktok', label: 'تيك توك Pixel', icon: '🎵', placeholder: 'TT-1234567890' },
          { key: 'pixel_snapchat', label: 'سناب شات Pixel', icon: '👻', placeholder: 'SNAP-1234567890' },
          { key: 'pixel_twitter', label: 'تويتر Pixel', icon: '𝕏', placeholder: 'o9x1j' },
          { key: 'pixel_google_ads', label: 'Google Ads', icon: '🔴', placeholder: 'AW-123456789' },
          { key: 'pixel_taboola', label: 'Taboola Pixel', icon: '📊', placeholder: '1234567' },
        ].map(p => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center' }}>{p.icon}</span>
            <span style={{ fontWeight: 600, minWidth: 110, fontSize: '0.9rem' }}>{p.label}</span>
            <input type="text" className="form-input" style={{ flex: 1, direction: 'ltr', fontFamily: 'monospace' }}
              value={settings[p.key] || ''} placeholder={p.placeholder} onChange={e => setVal(p.key, e.target.value)} readOnly={!can('marketing.manage')} />
          </div>
        ))}
      </div>

      {can('marketing.manage') && (
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}
          onClick={() => saveGroup(['pixel_facebook', 'pixel_tiktok', 'pixel_snapchat', 'pixel_twitter', 'pixel_google_ads', 'pixel_taboola'])} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ أكواد التتبع'}
        </button>
      )}
    </div>
  )
}

function DiscountCodesSection({ can }) {
  const [codes, setCodes] = useState([])
  const [form, setForm] = useState({ ...emptyCodeForm })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [animOut, setAnimOut] = useState(false)

  useEffect(() => { loadCodes() }, [])

  async function loadCodes() {
    try { setCodes(await request('/api/discount-codes')) }
    catch { setError('فشل تحميل أكواد الخصم') }
  }

  function openCreate() { setForm({ ...emptyCodeForm }); setEditingId(null); setAnimOut(false); setShowForm(true); setError('') }
  function openEdit(c) {
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
      max_uses: c.max_uses || '', min_purchase: c.min_purchase || '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '', is_active: c.is_active,
    })
    setEditingId(c.id); setAnimOut(false); setShowForm(true); setError('')
  }
  function closeForm() { setAnimOut(true); setTimeout(() => setShowForm(false), 200) }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const body = {
        ...form,
        discount_value: Number(form.discount_value) || 0,
        max_uses: Number(form.max_uses) || null,
        min_purchase: Number(form.min_purchase) || null,
        expires_at: form.expires_at || null,
      }
      if (editingId) await request(`/api/discount-codes/${editingId}`, { method: 'PUT', body: JSON.stringify(body) })
      else await request('/api/discount-codes', { method: 'POST', body: JSON.stringify(body) })
      closeForm(); loadCodes()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('تأكيد حذف كود الخصم؟')) return
    try { await request(`/api/discount-codes/${id}`, { method: 'DELETE' }); loadCodes() }
    catch { setError('فشل الحذف') }
  }

  async function toggleActive(code) {
    try {
      await request(`/api/discount-codes/${code.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...code, is_active: code.is_active ? 0 : 1 }),
      })
      loadCodes()
    } catch { setError('فشل التحديث') }
  }

  const now = new Date()

  function getStatus(code) {
    if (!code.is_active) return { label: 'متوقف', color: '#94a3b8', bg: '#f1f5f9' }
    if (code.expires_at && new Date(code.expires_at) < now) return { label: 'منتهي', color: '#ef4444', bg: '#fee2e2' }
    if (code.max_uses && code.used_count >= code.max_uses) return { label: 'مستنفذ', color: '#f59e0b', bg: '#fef3c7' }
    return { label: 'نشط', color: '#10b981', bg: '#d1fae5' }
  }

  return (
    <div>
      <div className="promo-header">
        <div>
          <p className="promo-subtitle">إدارة أكواد الخصم للعملاء</p>
        </div>
        {can('marketing.manage') && (
          <button className="promo-add-btn" onClick={openCreate}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            إضافة كود خصم
          </button>
        )}
      </div>

      {error && <div className="promo-toast">{error}<button onClick={() => setError('')}>✕</button></div>}

      <div className="promo-stats">
        <div className="promo-stat" style={{ '--stat-color': '#3b82f6' }}>
          <div className="promo-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>🏷️</div>
          <div><div className="promo-stat-num">{codes.length}</div><div className="promo-stat-label">إجمالي الأكواد</div></div>
        </div>
        <div className="promo-stat" style={{ '--stat-color': '#10b981' }}>
          <div className="promo-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>✅</div>
          <div><div className="promo-stat-num">{codes.filter(c => getStatus(c).label === 'نشط').length}</div><div className="promo-stat-label">نشط</div></div>
        </div>
        <div className="promo-stat" style={{ '--stat-color': '#f59e0b' }}>
          <div className="promo-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>⏳</div>
          <div><div className="promo-stat-num">{codes.filter(c => getStatus(c).label === 'مستنفذ').length}</div><div className="promo-stat-label">مستنفذ</div></div>
        </div>
        <div className="promo-stat" style={{ '--stat-color': '#ef4444' }}>
          <div className="promo-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>⏰</div>
          <div><div className="promo-stat-num">{codes.filter(c => getStatus(c).label === 'منتهي' || getStatus(c).label === 'متوقف').length}</div><div className="promo-stat-label">منتهي</div></div>
        </div>
      </div>

      {showForm && (
        <div className={`promo-overlay ${animOut ? 'fade-out' : ''}`} onClick={closeForm}>
          <div className={`promo-modal ${animOut ? 'slide-down' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="promo-modal-header">
              <h3>{editingId ? '✏️ تعديل كود خصم' : '🏷️ إضافة كود خصم جديد'}</h3>
              <button className="promo-modal-close" onClick={closeForm}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="promo-form">
              <div className="promo-form-row">
                <div className="promo-field">
                  <label>الكود <span className="required">*</span></label>
                  <input className="promo-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: WELCOME20" required style={{ direction: 'ltr', fontFamily: 'monospace', fontWeight: 700 }} />
                </div>
                <div className="promo-field">
                  <label>نوع الخصم <span className="required">*</span></label>
                  <div className="promo-type-select">
                    {discountTypeOptions.map(o => (
                      <button key={o.value} type="button"
                        className={`promo-type-option ${form.discount_type === o.value ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, discount_type: o.value })}>
                        <span className="promo-type-emoji">{o.value === 'percentage' ? '%' : '💰'}</span>
                        <span>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="promo-form-row">
                <div className="promo-field">
                  <label>قيمة الخصم <span className="required">*</span></label>
                  <div className="promo-input-group">
                    <input type="number" min="1" className="promo-input" value={form.discount_value}
                      onChange={e => setForm({ ...form, discount_value: e.target.value })}
                      placeholder={form.discount_type === 'percentage' ? '20' : '10'} required />
                    <span className="promo-input-suffix">{form.discount_type === 'percentage' ? '%' : 'SAR'}</span>
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
              <div className="promo-form-row">
                <div className="promo-field">
                  <label>الاستخدام الأقصى</label>
                  <input type="number" min="0" className="promo-input" value={form.max_uses}
                    onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="50 (0 = غير محدود)" />
                </div>
                <div className="promo-field">
                  <label>تاريخ الانتهاء (اختياري)</label>
                  <DateInput value={form.expires_at} onChange={v => setForm({ ...form, expires_at: v })} />
                </div>
              </div>
              <div className="promo-form-actions">
                <button type="button" className="promo-btn promo-btn-secondary" onClick={closeForm}>إلغاء</button>
                <button type="submit" className="promo-btn promo-btn-primary" disabled={saving}>
                  {saving && <span className="spinner" />}
                  {saving ? 'جاري الحفظ...' : editingId ? 'تحديث الكود' : 'إضافة الكود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {codes.length === 0 ? (
        <div className="promo-empty">
          <div className="promo-empty-icon">🏷️</div>
          <h3>لا توجد أكواد خصم</h3>
          <p>لم يتم إضافة أي أكواد خصم بعد. أضف الكود الأول الآن!</p>
          {can('marketing.manage') && <button className="promo-add-btn" onClick={openCreate} style={{ marginTop: '1rem' }}>+ إضافة كود خصم</button>}
        </div>
      ) : (
        <div className="promo-grid">
          {codes.map(c => {
            const status = getStatus(c)
            return (
              <div key={c.id} className="promo-card">
                <div className="promo-card-accent" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} />
                <div className="promo-card-body">
                  <div className="promo-card-top">
                    <div className="promo-card-type">
                      <span className="promo-type-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                        {c.discount_type === 'percentage' ? '% نسبة' : '💰 ثابت'}
                      </span>
                      <span className="promo-status-dot" style={{ background: status.bg, color: status.color }}>
                        {status.label === 'نشط' && <span className="promo-status-pulse" style={{ background: status.color }} />}
                        {status.label}
                      </span>
                    </div>
                    {can('marketing.manage') ? (
                      <label className="promo-toggle" onClick={() => toggleActive(c)}>
                        <input type="checkbox" checked={c.is_active === 1} readOnly />
                        <span className="promo-toggle-track"><span className="promo-toggle-thumb" /></span>
                      </label>
                    ) : (
                      <span className={`badge badge-${c.is_active ? 'success' : 'secondary'}`}>{c.is_active ? 'نشط' : 'متوقف'}</span>
                    )}
                  </div>
                  <h3 className="promo-card-title" style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.2rem' }}>{c.code}</h3>
                  <div className="promo-card-details">
                    <div className="promo-percent-display" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                      <span className="promo-percent-big" style={{ color: '#d97706' }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${parseFloat(c.discount_value).toFixed(2)} SAR`}
                      </span>
                      <span className="promo-percent-label" style={{ color: '#92400e' }}>خصم</span>
                      {c.min_purchase ? <span className="promo-percent-limit">أقل فاتورة {c.min_purchase} ريال</span> : null}
                    </div>
                  </div>
                  <div className="promo-card-meta">
                    <span className="promo-meta-item">استخدام: {c.used_count || 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</span>
                    {c.expires_at && <span className="promo-meta-item">📅 ينتهي: {c.expires_at}</span>}
                    {!c.expires_at && <span className="promo-meta-item">♾️ بدون انتهاء</span>}
                  </div>
                  <div className="promo-card-actions">
                    {can('marketing.manage') && (
                      <button className="promo-action-btn edit" onClick={() => openEdit(c)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        تعديل
                      </button>
                    )}
                    {can('marketing.manage') && (
                      <button className="promo-action-btn delete" onClick={() => handleDelete(c.id)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        حذف
                      </button>
                    )}
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
