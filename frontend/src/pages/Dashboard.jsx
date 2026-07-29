import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrders, getProducts, getUsers, getDrivers } from '../api'

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

export default function Dashboard() {
  const { can } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/api/admin/stats').catch(() => null),
      getOrders({ limit: 10, sort: 'created_at', order: 'DESC' }).catch(() => []),
    ]).then(([s, orders]) => {
      setStats(Array.isArray(s) ? s[0] : s)
      setRecentOrders(Array.isArray(orders) ? orders : [])
      setLoading(false)
    })
  }, [])

  const orderStatusBadge = (status) => {
    const map = {
      pending: { label: 'قيد الانتظار', color: '#f59e0b', bg: '#fef3c7' },
      confirmed: { label: 'مؤكد', color: '#2563eb', bg: '#dbeafe' },
      preparing: { label: 'قيد التحضير', color: '#8b5cf6', bg: '#ede9fe' },
      out_for_delivery: { label: 'في الطريق', color: '#06b6d4', bg: '#cffafe' },
      delivered: { label: 'مكتمل', color: '#16a34a', bg: '#d1fae5' },
      cancelled: { label: 'ملغي', color: '#dc2626', bg: '#fee2e2' },
    }
    const m = map[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' }
    return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: m.bg, color: m.color }}>{m.label}</span>
  }

  if (loading) return <div className="loading">جاري التحميل...</div>

  return (
    <div>
      <div className="page-header">
        <h1><img src="/images/grid-fill.svg" alt="" style={{width:24,height:24}} /> الإحصائيات</h1>
      </div>

      <div className="mini-stats-row">
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><img src="/images/box-seam.svg" alt="" style={{width:24,height:24}} /></div>
          <div>
            <div className="mini-stat-value">{stats?.total_orders ?? '—'}</div>
            <div className="mini-stat-label">إجمالي الطلبات</div>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#d1fae5', color: '#16a34a' }}><img src="/images/cash.svg" alt="" style={{width:24,height:24}} /></div>
          <div>
            <div className="mini-stat-value">{stats?.total_revenue ? Number(stats.total_revenue).toFixed(2) + ' SAR' : '—'}</div>
            <div className="mini-stat-label">إجمالي الإيرادات</div>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><img src="/images/droplet.svg" alt="" style={{width:24,height:24}} /></div>
          <div>
            <div className="mini-stat-value">{stats?.total_products ?? '—'}</div>
            <div className="mini-stat-label">المنتجات</div>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}><img src="/images/people.svg" alt="" style={{width:24,height:24}} /></div>
          <div>
            <div className="mini-stat-value">{stats?.total_customers ?? '—'}</div>
            <div className="mini-stat-label">العملاء</div>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#cffafe', color: '#06b6d4' }}><img src="/images/truck.svg" alt="" style={{width:24,height:24}} /></div>
          <div>
            <div className="mini-stat-value">{stats?.total_drivers ?? '—'}</div>
            <div className="mini-stat-label">المندوبين</div>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon" style={{ background: '#fce7f3', color: '#ec4899' }}><img src="/images/star.svg" alt="" style={{width:24,height:24}} /></div>
          <div>
            <div className="mini-stat-value">{stats?.total_reviews ?? '—'}</div>
            <div className="mini-stat-label">التقييمات</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <div className="card">
          <h4 style={{ margin: '0 0 12px' }}>أحدث الطلبات</h4>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 8).map(o => (
                  <tr key={o.id}>
                    <td><Link to="/admin/orders" style={{ color: '#2563eb', fontWeight: 600 }}>#{o.id}</Link></td>
                    <td style={{ fontSize: 13 }}>{o.customer_name || o.customer?.name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{Number(o.total || o.total_amount || 0).toFixed(2)} SAR</td>
                    <td>{orderStatusBadge(o.status)}</td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('ar-SA') : '—'}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan="5" className="text-center" style={{ color: '#94a3b8', padding: '1.5rem' }}>لا توجد طلبات</td></tr>}
              </tbody>
            </table>
          </div>
          {recentOrders.length > 8 && (
            <Link to="/admin/orders" className="btn btn-sm" style={{ marginTop: 8 }}>عرض الكل →</Link>
          )}
        </div>

        <div className="card">
          <h4 style={{ margin: '0 0 12px' }}>روابط سريعة</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {can('products.view') && <Link to="/admin/products" className="quick-link"><span><img src="/images/droplet.svg" alt="" style={{width:20,height:20}} /></span> المنتجات</Link>}
            {can('orders.view') && <Link to="/admin/orders" className="quick-link"><span><img src="/images/box-seam.svg" alt="" style={{width:20,height:20}} /></span> الطلبات</Link>}
            {can('categories.view') && <Link to="/admin/categories" className="quick-link"><span><img src="/images/folder.svg" alt="" style={{width:20,height:20}} /></span> التصنيفات</Link>}
            {can('users.view') && <Link to="/admin/users" className="quick-link"><span><img src="/images/people.svg" alt="" style={{width:20,height:20}} /></span> العملاء</Link>}
            {can('drivers.view') && <Link to="/admin/drivers" className="quick-link"><span><img src="/images/truck.svg" alt="" style={{width:20,height:20}} /></span> المندوبين</Link>}
            {can('reports.view') && <Link to="/admin/reports" className="quick-link"><span><img src="/images/bar-chart.svg" alt="" style={{width:20,height:20}} /></span> التقارير</Link>}
            {can('reviews.manage') && <Link to="/admin/reviews" className="quick-link"><span><img src="/images/star.svg" alt="" style={{width:20,height:20}} /></span> التقييمات</Link>}
            {can('marketing.manage') && <Link to="/admin/marketing-tools" className="quick-link"><span><img src="/images/megaphone.svg" alt="" style={{width:20,height:20}} /></span> الأدوات التسويقية</Link>}
            {can('settings.view') && <Link to="/admin/settings" className="quick-link"><span><img src="/images/gear.svg" alt="" style={{width:20,height:20}} /></span> الإعدادات</Link>}
            {can('support.manage') && <Link to="/admin/support" className="quick-link"><span><img src="/images/chat-dots.svg" alt="" style={{width:20,height:20}} /></span> الدعم الفني</Link>}
          </div>
        </div>
      </div>
    </div>
  )
}
