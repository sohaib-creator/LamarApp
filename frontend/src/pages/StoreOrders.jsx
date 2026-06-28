import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrders } from '../api'
import OrderMap from '../components/OrderMap'
import AnimatedSection from '../components/AnimatedSection'
import { SkeletonOrderCard } from '../components/Skeleton'

const statusMap = { pending: 'قيد الانتظار', confirmed: 'مؤكد', preparing: 'قيد التحضير', out_for_delivery: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي' }
const statusBadge = { pending: 'warning', confirmed: 'info', preparing: 'info', out_for_delivery: 'warning', delivered: 'success', cancelled: 'danger' }

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getOrders().then(d => { setOrders(d || []); setLoading(false) }).catch(() => setLoading(false))
  }, [user])

  if (!user) return <div className="empty-state page-transition"><div className="empty-icon">🔒</div><h2>يرجى تسجيل الدخول</h2><Link to="/login" className="btn btn-primary">دخول</Link></div>

  return (
    <div className="orders-page page-transition">
      <h2>طلباتي</h2>
      {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonOrderCard key={i} />)}
      {!loading && orders.length === 0 && (
        <div className="empty-state"><p style={{ marginBottom: '1rem' }}>لا توجد طلبات حتى الآن</p><Link to="/" className="btn btn-primary">تصفح المنتجات</Link></div>
      )}
      {!loading && orders.map((o, i) => (
        <AnimatedSection key={o.id} animation="fadeInUp" delay={`${i * 0.1}s`}>
          <div className="order-card">
            <div className="order-header">
              <span className="order-number">{o.order_number}</span>
              <span className={`badge badge-${statusBadge[o.status]}`}>{statusMap[o.status]}</span>
            </div>
            <div className="order-meta">
              <span>{parseFloat(o.total).toFixed(2)} SAR</span>
              <span>{o.payment_method === 'cash' ? 'نقداً' : o.payment_method === 'card' ? 'بطاقة' : o.payment_method === 'tabby' ? 'تابي' : 'تمارا'}</span>
              <span>{new Date(o.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
            <OrderMap lat={o.address_lat} lng={o.address_lng} street={o.address_street} city={o.address_city} />
          </div>
        </AnimatedSection>
      ))}
    </div>
  )
}
