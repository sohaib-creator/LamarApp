import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDiscountSettings, updateDiscountSetting } from '../api'

export default function Settings() {
  const { can } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [tab, setTab] = useState('discount')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await getDiscountSettings()
      if (data?.[0]) setSettings(data[0])
    } catch {} finally { setLoading(false) }
  }

  async function save(key, value) {
    setSaving(true); setMsg({ text: '', type: '' })
    try {
      await updateDiscountSetting(key, String(value))
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
        await updateDiscountSetting(key, String(settings[key] || ''))
      }
      setMsg({ text: '✓ تم حفظ جميع الإعدادات', type: 'success' })
    } catch (e) { setMsg({ text: '✗ ' + e.message, type: 'error' }) }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    setSaving(false)
  }

  function setVal(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  if (loading) return <div className="loading">جاري التحميل...</div>

  const tabs = [
    { id: 'discount', label: 'خصم الطلب الأول', icon: '🏷️' },
    { id: 'social', label: 'روابط التواصل', icon: '🔗' },
  ]

  const enabled = settings.first_order_discount_enabled === '1'
  const pct = parseFloat(settings.first_order_discount_percent) || 0
  const maxAmt = parseFloat(settings.first_order_discount_max_amount) || 0

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ الإعدادات</h1>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: 8, border: tab === t.id ? '2px solid var(--primary)' : '2px solid var(--border)',
              background: tab === t.id ? 'var(--primary)' : '#fff', color: tab === t.id ? '#fff' : 'var(--text)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '1.5rem 2rem' }}>
        {tab === 'discount' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>تفعيل الخصم</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>خصم تلقائي على أول طلب لكل عميل جديد</p>
              </div>
              {can('settings.update') ? (
                <label className="toggle">
                  <input type="checkbox" checked={enabled} onChange={e => save('first_order_discount_enabled', e.target.checked ? '1' : '0')} />
                  <span className="toggle-slider"></span>
                </label>
              ) : (
                <span className={`badge badge-${enabled ? 'success' : 'secondary'}`}>{enabled ? 'مفعل' : 'معطل'}</span>
              )}
            </div>

            {enabled && (
              <>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>نسبة الخصم</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>نسبة مئوية من قيمة الطلب</p>
                    <div className="input-group">
                      <input type="number" className="form-input" style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                        value={settings.first_order_discount_percent || 0} min="0" max="100"
                        onChange={e => setVal('first_order_discount_percent', e.target.value)} />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>الحد الأقصى للخصم</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>0 يعني بدون حد أقصى</p>
                    <div className="input-group">
                      <input type="number" className="form-input" style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                        value={settings.first_order_discount_max_amount || 0} min="0"
                        onChange={e => setVal('first_order_discount_max_amount', e.target.value)} />
                      <span className="input-suffix">SAR</span>
                    </div>
                  </div>
                </div>
                {can('settings.update') && (
                  <button className="btn btn-primary" onClick={() => saveGroup(['first_order_discount_percent', 'first_order_discount_max_amount'])} disabled={saving}>
                    {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
                  </button>
                )}

                <div style={{
                  background: 'linear-gradient(135deg, #f5eeff, #d4eaf7)', borderRadius: 16, padding: '1.25rem 1.5rem',
                  border: '2px dashed var(--primary)', marginTop: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>🎉</span>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>معاينة الخصم للعميل</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>قيمة الطلب</span>
                      <span style={{ fontWeight: 700 }}>100 SAR</span>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الخصم</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>-{(maxAmt > 0 && (100 * pct / 100) > maxAmt ? maxAmt.toFixed(2) : (100 * pct / 100).toFixed(2))} SAR</span>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الإجمالي بعد الخصم</span>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {(100 - (maxAmt > 0 && (100 * pct / 100) > maxAmt ? maxAmt : (100 * pct / 100))).toFixed(2)} SAR
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!enabled && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🏷️</span>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>الخصم معطل حالياً</p>
                <p style={{ fontSize: '0.85rem' }}>فعّل الخصم من المفتاح أعلاه</p>
              </div>
            )}
          </>
        )}

        {tab === 'social' && (
          <>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>🔗 روابط التواصل الاجتماعي</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>الروابط تظهر في فوتر الموقع الإلكتروني</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'social_whatsapp', label: 'واتساب', icon: '📱', dir: 'ltr' },
                { key: 'social_twitter', label: 'تويتر / X', icon: '𝕏', dir: 'ltr' },
                { key: 'social_instagram', label: 'انستقرام', icon: '📷', dir: 'ltr' },
                { key: 'social_snapchat', label: 'سناب شات', icon: '👻', dir: 'ltr' },
                { key: 'social_facebook', label: 'فيسبوك', icon: '📘', dir: 'ltr' },
                { key: 'social_tiktok', label: 'تيك توك', icon: '🎵', dir: 'ltr' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem', width: 32, textAlign: 'center' }}>{s.icon}</span>
                  <span style={{ fontWeight: 600, minWidth: 90, fontSize: '0.9rem' }}>{s.label}</span>
                  <input type="text" className="form-input" style={{ flex: 1, direction: s.dir }}
                    value={settings[s.key] || ''} placeholder={`رابط ${s.label}`}
                    onChange={e => setVal(s.key, e.target.value)} />
                </div>
              ))}
            </div>
            {can('settings.update') && (
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}
                onClick={() => saveGroup(['social_whatsapp', 'social_twitter', 'social_instagram', 'social_snapchat', 'social_facebook', 'social_tiktok'])}
                disabled={saving}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ الروابط'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
