import { useState, useEffect } from 'react'
import { getDiscountSettings, updateDiscountSetting } from '../api'

export default function FirstOrderDiscount() {
  const [settings, setSettings] = useState({
    first_order_discount_enabled: '0',
    first_order_discount_percent: '20',
    first_order_discount_max_amount: '50',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await getDiscountSettings()
      if (data?.[0]) setSettings(prev => ({ ...prev, ...data[0] }))
    } catch {} finally { setLoading(false) }
  }

  async function save(key, value) {
    setSaving(true); setMsg({ text: '', type: '' })
    try {
      await updateDiscountSetting(key, String(value))
      setSettings(prev => ({ ...prev, [key]: String(value) }))
      setMsg({ text: '✓ تم حفظ الإعداد بنجاح', type: 'success' })
    } catch (e) {
      setMsg({ text: '✗ ' + e.message, type: 'error' })
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    setSaving(false)
  }

  async function saveAll() {
    setSaving(true); setMsg({ text: '', type: '' })
    try {
      await updateDiscountSetting('first_order_discount_percent', settings.first_order_discount_percent)
      await updateDiscountSetting('first_order_discount_max_amount', settings.first_order_discount_max_amount)
      setMsg({ text: '✓ تم حفظ جميع الإعدادات', type: 'success' })
    } catch (e) {
      setMsg({ text: '✗ ' + e.message, type: 'error' })
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    setSaving(false)
  }

  const enabled = settings.first_order_discount_enabled === '1'
  const pct = parseFloat(settings.first_order_discount_percent) || 0
  const maxAmt = parseFloat(settings.first_order_discount_max_amount) || 0

  if (loading) return <div className="loading">جاري التحميل...</div>

  return (
    <div>
      <div className="page-header">
        <h1>🏷️ خصم الطلب الأول</h1>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>
          {msg.text}
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>تفعيل الخصم</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>خصم تلقائي على أول طلب لكل عميل جديد</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={enabled} onChange={e => save('first_order_discount_enabled', e.target.checked ? '1' : '0')} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {enabled && (
          <>
            <div className="row" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>نسبة الخصم</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>نسبة مئوية من قيمة الطلب</p>
                <div className="input-group">
                  <input
                    type="number" className="form-input" style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                    value={settings.first_order_discount_percent} min="0" max="100"
                    onChange={e => setSettings(prev => ({ ...prev, first_order_discount_percent: e.target.value }))}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>الحد الأقصى للخصم</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>0 يعني بدون حد أقصى</p>
                <div className="input-group">
                  <input
                    type="number" className="form-input" style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                    value={settings.first_order_discount_max_amount} min="0"
                    onChange={e => setSettings(prev => ({ ...prev, first_order_discount_max_amount: e.target.value }))}
                  />
                  <span className="input-suffix">SAR</span>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={saveAll} disabled={saving} style={{ marginBottom: '1.5rem' }}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
            </button>

            <div style={{
              background: 'linear-gradient(135deg, #f5eeff, #d4eaf7)',
              borderRadius: 16, padding: '1.25rem 1.5rem',
              border: '2px dashed var(--primary)'
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
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>-{maxAmt > 0 && (100 * pct / 100) > maxAmt ? maxAmt.toFixed(2) : (100 * pct / 100).toFixed(2)} SAR</span>
                </div>
                <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الإجمالي بعد الخصم</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {((100 - (maxAmt > 0 && (100 * pct / 100) > maxAmt ? maxAmt : (100 * pct / 100)))).toFixed(2)} SAR
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0', textAlign: 'center' }}>
                بناءً على طلب بقيمة 100 SAR {pct > 0 ? `- خصم ${pct}%` : ''}{maxAmt > 0 ? ` بحد أقصى ${maxAmt} SAR` : ''}
              </p>
            </div>
          </>
        )}

        {!enabled && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🏷️</span>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>الخصم معطل حالياً</p>
            <p style={{ fontSize: '0.85rem' }}>فعّل الخصم من المفتاح أعلاه لبدء تقديم خصم الطلب الأول للعملاء الجدد</p>
          </div>
        )}
      </div>
    </div>
  )
}
