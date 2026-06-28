import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAddresses, createAddress, createOrder, getPaymentMethods, getDeliveryCities, getFirstOrderDiscount, validateDiscountCode } from '../api'
import LocationPicker from '../components/LocationPicker'
import AnimatedSection from '../components/AnimatedSection'

const steps = ['العنوان', 'المنتجات', 'الدفع', 'التأكيد']

export default function Checkout() {
  const { user, loading: authLoading } = useAuth(); const navigate = useNavigate()
  const [addresses, setAddresses] = useState([]); const [selectedAddr, setSelectedAddr] = useState(''); const [payment, setPayment] = useState('cash'); const [loading, setLoading] = useState(false)
  const [lat, setLat] = useState(null); const [lng, setLng] = useState(null)
  const [newAddr, setNewAddr] = useState({ street: '', district: '', city: '' })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [activeCities, setActiveCities] = useState([])
  const [discountInfo, setDiscountInfo] = useState({})
  const [codeInput, setCodeInput] = useState('')
  const [codeStatus, setCodeStatus] = useState(null)
  const [animClass, setAnimClass] = useState('')
  const items = JSON.parse(localStorage.getItem('cart') || '[]')
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const delivery = 5
  const discountEnabled = discountInfo.first_order_discount_enabled === '1'
  const discountEligible = discountInfo.eligible !== '0'
  const discountPct = parseFloat(discountInfo.first_order_discount_percent) || 0
  const discountMax = parseFloat(discountInfo.first_order_discount_max_amount) || 0
  const codeDiscount = codeStatus?.valid ? parseFloat(codeStatus.discount_amount) || 0 : 0
  const rawDisc = subtotal * (discountPct / 100)
  const firstOrderDiscount = (discountEnabled && discountEligible) ? (discountMax > 0 ? Math.min(rawDisc, discountMax) : rawDisc) : 0
  const discount = codeDiscount || firstOrderDiscount
  const total = subtotal + delivery - discount

  const currentStep = !selectedAddr ? 0 : 1

  useEffect(() => {
    if (authLoading) return
    if (!user) return navigate('/login')
    getAddresses().then(d => { setAddresses(d || []); if (d?.length) setSelectedAddr(d[0].id) }).catch(() => {})
    getPaymentMethods().then(setPaymentMethods).catch(() => {})
    getDeliveryCities().then(setActiveCities).catch(() => {})
    getFirstOrderDiscount().then(d => { if (d?.[0]) setDiscountInfo(d[0]) }).catch(() => {})
  }, [authLoading, user])

  async function handleAddAddress(e) {
    e.preventDefault()
    try {
      await createAddress({ ...newAddr, latitude: lat, longitude: lng })
      const data = await getAddresses()
      setAddresses(data || [])
      if (data?.length) setSelectedAddr(data[0].id)
      setNewAddr({ street: '', district: '', city: '' })
      setLat(null); setLng(null)
    } catch (err) { alert(err.message) }
  }

  async function applyCode() {
    const c = codeInput.trim().toUpperCase()
    if (!c) return
    setCodeStatus('loading')
    setAnimClass('')
    try {
      const res = await validateDiscountCode(c, subtotal)
      if (res.valid) { setCodeStatus({ valid: true, message: res.message, discount_amount: res.data?.discount_amount || 0, code: c }); setAnimClass('code-success') }
      else { setCodeStatus({ valid: false, message: res.message, discount_amount: 0, code: c }); setAnimClass('code-error') }
    } catch { setCodeStatus({ valid: false, message: 'فشل التحقق من الكود', discount_amount: 0, code: c }); setAnimClass('code-error') }
  }

  function removeCode() {
    setCodeInput('')
    setCodeStatus(null)
    setAnimClass('')
  }

  async function handleOrder() {
    if (!selectedAddr) return alert('الرجاء اختيار عنوان')
    setLoading(true)
    try {
      await createOrder({
        address_id: selectedAddr, payment_method: payment,
        items: items.map(i => ({ product_id: i.id, quantity: i.qty })),
        delivery_fee: delivery,
        discount_code: codeStatus?.valid ? codeStatus.code : null,
      })
      localStorage.removeItem('cart'); window.dispatchEvent(new Event('cartUpdated'))
      alert('🎉 تم إنشاء الطلب بنجاح!'); navigate('/orders')
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  if (items.length === 0) { navigate('/cart'); return null }

  return (
    <div className="checkout-page">
      <h2 style={{ textAlign: 'center' }}>إتمام الطلب</h2>

      <div className="step-progress">
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step-item${i <= currentStep ? ' completed' : ''}${i === currentStep ? ' active' : ''}`}>
              <div className="step-circle">{i < currentStep ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`step-connector${i < currentStep ? ' done' : ''}`} />}
          </div>
        ))}
      </div>

      <AnimatedSection animation="fadeInUp" delay="0.1s">
        <div className="checkout-section">
          <h3>📍 العنوان</h3>
          {addresses.map(a => (
            <label key={a.id} className={`addr-option ${selectedAddr === a.id ? 'selected' : ''}`}>
              <input type="radio" name="addr" checked={selectedAddr === a.id} onChange={() => setSelectedAddr(a.id)} />
              <div>
                <strong>{a.street}</strong>
                <br /><small style={{ color: 'var(--text-light)' }}>{a.city}{a.district ? ` - ${a.district}` : ''}</small>
                {a.latitude && a.longitude && <><br /><small style={{ color: 'var(--secondary-dark)' }}>📍 موقع محدد</small></>}
              </div>
            </label>
          ))}
          <details>
            <summary>+ إضافة عنوان جديد</summary>
            <form onSubmit={handleAddAddress}>
              <input placeholder="الشارع" value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} required />
              <input placeholder="الحي" value={newAddr.district} onChange={e => setNewAddr({...newAddr, district: e.target.value})} />
              <select value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} required>
                <option value="">اختر المدينة</option>
                {activeCities.map(c => <option key={c.id} value={c.name_ar}>{c.name_ar}</option>)}
              </select>
              <LocationPicker lat={lat} lng={lng} onLocationChange={(lat, lng) => { setLat(lat); setLng(lng) }} />
              <button type="submit" className="btn btn-primary btn-sm">حفظ العنوان</button>
            </form>
          </details>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fadeInUp" delay="0.2s">
        <div className="checkout-section">
          <h3>🛍️ المنتجات</h3>
          {items.map(i => <div key={i.id} className="checkout-item"><span>{i.name_ar} × {i.qty}</span><span>{(i.price * i.qty).toFixed(2)} SAR</span></div>)}
          <div className="checkout-item"><span>توصيل</span><span>{delivery}.00 SAR</span></div>
          {codeDiscount > 0 && <div className="checkout-item" style={{ color: 'var(--success)' }}><span>🏷️ خصم الكود ({codeStatus?.code})</span><span>-{codeDiscount.toFixed(2)} SAR</span></div>}
          {!codeDiscount && firstOrderDiscount > 0 && <div className="checkout-item" style={{ color: 'var(--success)' }}><span>🎉 خصم الطلب الأول ({discountPct}%)</span><span>-{firstOrderDiscount.toFixed(2)} SAR</span></div>}
          <div className="checkout-total"><strong>الإجمالي: {total.toFixed(2)} SAR</strong></div>
          {discountEnabled && discountEligible && !codeStatus?.valid && <div style={{ background: '#dcfce7', padding: '0.75rem 1rem', borderRadius: 12, marginTop: '0.75rem', fontSize: '0.85rem', color: '#166534' }}>
            🎉 خصم {discountPct}% على أول طلب بقيمة تصل إلى {discountMax > 0 ? discountMax + ' SAR' : 'غير محدود'}
          </div>}
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fadeInUp" delay="0.3s">
        <div className="checkout-section">
          <h3>🏷️ كود الخصم</h3>
          {codeStatus?.valid ? (
            <div className={animClass} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#dcfce7', borderRadius: 12, padding: '0.75rem 1rem' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>✅ {codeStatus.code}</span>
                <br /><span style={{ fontSize: '0.8rem', color: '#166534' }}>خصم {codeDiscount.toFixed(2)} SAR</span>
              </div>
              <button onClick={removeCode} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>إزالة</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="form-input" style={{ flex: 1, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, direction: 'ltr' }}
                placeholder="أدخل كود الخصم" value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyCode()} />
              <button className="btn btn-primary btn-ripple" onClick={applyCode} disabled={codeStatus === 'loading' || !codeInput.trim()}>
                {codeStatus === 'loading' ? '...' : 'تطبيق'}
              </button>
            </div>
          )}
          {codeStatus && !codeStatus.valid && (
            <div className={animClass} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>✕</span> {codeStatus.message}
            </div>
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fadeInUp" delay="0.4s">
        <div className="checkout-section">
          <h3>💳 طريقة الدفع</h3>
          {paymentMethods.map(m => (
            <label key={m.name_slug} className={`pay-option ${payment === m.name_slug ? 'selected' : ''}`}>
              <input type="radio" name="payment" checked={payment === m.name_slug} onChange={() => setPayment(m.name_slug)} />
              <span>{m.icon} {m.display_name_ar}</span>
            </label>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fadeInUp" delay="0.5s">
        <button className="btn btn-primary btn-block btn-lg btn-ripple" onClick={handleOrder} disabled={loading}>
          {loading ? 'جاري معالجة الطلب...' : 'تأكيد الطلب'}
        </button>
      </AnimatedSection>
    </div>
  )
}
