import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProduct, getActivePromotions, getProductReviews, getProductRating, getCanRate, createReview, deleteReview } from '../api'
import AnimatedSection from '../components/AnimatedSection'

function StarRating({ rating, onRate, readonly }) {
  return (
    <div className="star-rating" dir="ltr">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= rating ? 'filled' : ''} ${readonly ? '' : 'clickable'}`}
          onClick={() => !readonly && onRate?.(i)}>
          {i <= rating ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState([])
  const [ratingSummary, setRatingSummary] = useState({ review_count: 0, avg_rating: 0 })
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [canRate, setCanRate] = useState(false)

  useEffect(() => {
    getProduct(id).then(d => { if (d?.[0]) setProduct(d[0]) }).catch(() => navigate('/'))
    getActivePromotions().then(setPromotions).catch(() => {})
    getProductReviews(id).then(setReviews).catch(() => {})
    getProductRating(id).then(d => { if (d?.[0]) setRatingSummary(d[0]) }).catch(() => {})
    getCanRate(id).then(d => { if (d?.[0]) setCanRate(d[0].can_rate) }).catch(() => {})
  }, [id])

  function getProductPromo(product) {
    if (!product) return null
    const now = new Date()
    return promotions.find(p => {
      const s = p.start_date ? new Date(p.start_date) : null
      const e = p.end_date ? new Date(p.end_date) : null
      if (s && s > now) return false
      if (e && e < now) return false
      if (p.applicable_to === 'all') return true
      if (p.applicable_to === 'specific_product') return Number(p.product_id) === Number(product.id)
      if (p.applicable_to === 'specific_category') return Number(p.category_id) === Number(product.category_id)
      return false
    })
  }

  function addToCart() {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(i => i.id === product.id)
    if (existing) existing.qty += qty
    else cart.push({ id: product.id, name_ar: product.name_ar, price: parseFloat(product.price), qty })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!canRate && !userComment.trim()) { setReviewError('يرجى كتابة تعليق'); return }
    if (canRate && !userRating && !userComment.trim()) { setReviewError('يرجى إضافة تقييم أو تعليق'); return }
    setSubmitting(true)
    setReviewError('')
    try {
      await createReview(id, canRate ? userRating : 0, userComment)
      setUserRating(0)
      setUserComment('')
      const [newReviews, newRating] = await Promise.all([getProductReviews(id), getProductRating(id)])
      setReviews(newReviews)
      if (newRating?.[0]) setRatingSummary(newRating[0])
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('هل أنت متأكد من حذف التقييم؟')) return
    try {
      await deleteReview(reviewId)
      setReviews(reviews.filter(r => r.id !== reviewId))
      const newRating = await getProductRating(id)
      if (newRating?.[0]) setRatingSummary(newRating[0])
    } catch {}
  }

  function getReviewStats() {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    const approved = reviews.filter(r => r.status === 'approved')
    approved.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++ })
    return { total: approved.length, counts }
  }

  if (!product) return <div className="empty-state page-transition"><div className="empty-icon">⏳</div><h2>جاري التحميل...</h2></div>

  const hasDiscount = product.old_price && parseFloat(product.old_price) > parseFloat(product.price)
  const discountPercent = hasDiscount ? Math.round((1 - parseFloat(product.price) / parseFloat(product.old_price)) * 100) : 0
  const token = localStorage.getItem('token')
  const reviewStats = getReviewStats()
  const approvedReviews = reviews.filter(r => r.status === 'approved')

  return (
    <div className="product-detail page-transition">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">الرئيسية</Link> / <Link to="/#products">المنتجات</Link> / <span>{product.name_ar}</span>
        </div>

        <div className="detail-grid">
          <AnimatedSection animation="fadeInUp" delay="0.1s">
            <div className="detail-image">
              <div className="detail-image-icon" style={{ animation: 'float 4s ease-in-out infinite' }}>{product.image || '💧'}</div>
              {hasDiscount && <span className="discount-badge">خصم {discountPercent}%</span>}
              {Number(ratingSummary.review_count) > 0 && (
                <div className="detail-rating-badge">
                  <StarRating rating={Math.round(Number(ratingSummary.avg_rating))} readonly />
                  <span>({ratingSummary.review_count})</span>
                </div>
              )}
            </div>
          </AnimatedSection>

          <div className="detail-info">
            <AnimatedSection animation="fadeInUp" delay="0.15s">
              <span className="detail-category">{product.category_name_ar}</span>
            </AnimatedSection>
            <AnimatedSection animation="fadeInUp" delay="0.2s">
              <h1>{product.name_ar}</h1>
            </AnimatedSection>

            {product.size_liters && (
              <AnimatedSection animation="fadeInUp" delay="0.25s">
                <div className="detail-size">
                  <span>الحجم:</span> <strong>{parseFloat(product.size_liters)} لتر</strong>
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection animation="fadeInUp" delay="0.3s">
              <div className="detail-pricing">
                <span className="detail-price">{parseFloat(product.price).toFixed(2)} SAR</span>
                {hasDiscount && <span className="detail-old-price">{parseFloat(product.old_price).toFixed(2)} SAR</span>}
              </div>
            </AnimatedSection>

            {(() => {
              const promo = getProductPromo(product)
              if (!promo) return null
              return (
                <AnimatedSection animation="fadeInUp" delay="0.35s">
                  <div className={`detail-promo${promo.type === 'percentage' ? ' perc' : ''}`}>
                    {promo.type === 'buy_x_get_y'
                      ? `🎁 عرض: اشتر ${promo.buy_quantity} واحصل على ${promo.free_quantity} مجاناً`
                      : `🏷️ عرض: خصم ${promo.discount_percent}%${promo.max_discount_amount ? ` (بحد أقصى ${promo.max_discount_amount} ريال)` : ''}`
                    }
                    {promo.min_purchase ? ` | أقل فاتورة: ${promo.min_purchase} ريال` : ''}
                  </div>
                </AnimatedSection>
              )
            })()}

            {product.description && (
              <AnimatedSection animation="fadeInUp" delay="0.4s">
                <div className="detail-desc">
                  <h3>الوصف</h3>
                  <p>{product.description}</p>
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection animation="fadeInUp" delay="0.45s">
              <div className="detail-stock">
                <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                  {product.stock > 0 ? '✅ متوفر' : '❌ غير متوفر'}
                </span>
              </div>
            </AnimatedSection>

            {product.stock > 0 && (
              <AnimatedSection animation="fadeInUp" delay="0.5s">
                <div className="detail-actions">
                  <div className="qty-controls">
                    <button className="btn btn-outline btn-sm btn-ripple" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                    <span className="qty-value">{qty}</span>
                    <button className="btn btn-primary btn-sm btn-ripple" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
                  </div>
                  <button className="btn btn-primary btn-lg btn-ripple" onClick={addToCart} style={{ flex: 1 }}>
                    {added ? '✓ تمت الإضافة' : 'أضف إلى السلة'}
                  </button>
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection animation="fadeInUp" delay="0.55s">
              <div className="detail-features">
                <div className="detail-feature">🚚 توصيل سريع</div>
                <div className="detail-feature">💳 دفع آمن</div>
                <div className="detail-feature">🔄 إرجاع مجاني</div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        <AnimatedSection animation="fadeInUp" delay="0.6s">
          <div className="reviews-section">
            <h2>التقييمات</h2>

            {Number(ratingSummary.review_count) > 0 && (
              <div className="reviews-summary">
                <div className="reviews-avg">
                  <span className="avg-number">{Number(ratingSummary.avg_rating).toFixed(1)}</span>
                  <StarRating rating={Math.round(Number(ratingSummary.avg_rating))} readonly />
                  <span className="avg-count">{ratingSummary.review_count} تقييم</span>
                </div>
                <div className="reviews-bars">
                  {[5,4,3,2,1].map(s => {
                    const pct = reviewStats.total ? (reviewStats.counts[s] / reviewStats.total) * 100 : 0
                    return (
                      <div key={s} className="review-bar-row">
                        <span className="bar-label">{s} ★</span>
                        <div className="review-bar-track"><div className="review-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="bar-count">{reviewStats.counts[s]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {token ? (
              <form className="review-form" onSubmit={handleReviewSubmit}>
                <h3>{canRate ? 'أضف تقييمك' : 'أضف تعليقاً'}</h3>
                {reviewError && <div className="alert alert-error">{reviewError}</div>}
                {canRate && (
                  <div className="review-form-row">
                    <label>التقييم:</label>
                    <StarRating rating={userRating} onRate={setUserRating} />
                  </div>
                )}
                {!canRate && (
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                    يمكنك إضافة تعليق فقط. التقييم بالنجوم متاح بعد طلب المنتج.
                  </p>
                )}
                <div className="form-group">
                  <textarea value={userComment} onChange={e => setUserComment(e.target.value)}
                    placeholder={canRate ? 'اكتب تعليقك (اختياري)' : 'اكتب تعليقك'} rows={3} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'جاري الإرسال...' : (canRate ? 'إرسال التقييم' : 'إرسال التعليق')}
                </button>
              </form>
            ) : (
              <div className="review-login-hint">
                <Link to="/login">سجل الدخول</Link> لإضافة {canRate ? 'تقييم' : 'تعليق'}
              </div>
            )}

            <div className="reviews-list">
              {approvedReviews.length === 0 && <p className="text-center" style={{ color: '#999', padding: '2rem 0' }}>لا توجد تقييمات بعد</p>}
              {approvedReviews.map(r => (
                <div key={r.id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <div className="review-avatar">{r.user_name?.charAt(0) || '?'}</div>
                      <div>
                        <div className="review-user-name">{r.user_name}</div>
                        <div className="review-date">{new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {r.rating > 0 && <StarRating rating={r.rating} readonly />}
                      {Number(r.user_id) === Number(JSON.parse(localStorage.getItem('user') || '{}').id) && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleDeleteReview(r.id)}
                          style={{ color: '#ef4444', borderColor: '#ef4444', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
