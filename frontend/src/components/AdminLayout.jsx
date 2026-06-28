import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINK_PERMS = {
  '/': 'dashboard.view',
  '/orders': 'orders.view',
  '/products': 'products.view',
  '/categories': 'categories.view',
  '/users': 'users.view',
  '/drivers': 'drivers.view',
  '/reports': 'reports.view',
  '/reviews': 'reviews.manage',
  '/marketing-tools': 'marketing.manage',
  '/payment-methods': 'payments.view',
  '/delivery-cities': 'delivery.view',
  '/dashboard-users': 'admin.users',
  '/settings': 'settings.view',
  '/support': 'support.manage',
}

const allLinks = [
  { to: '/', label: 'الإحصائيات', icon: '📊' },
  { to: '/orders', label: 'الطلبات', icon: '📦' },
  { to: '/products', label: 'المنتجات', icon: '💧' },
  { to: '/categories', label: 'التصنيفات', icon: '📁' },
  { to: '/users', label: 'العملاء', icon: '👥' },
  { to: '/drivers', label: 'المندوبين', icon: '🚚' },
  { to: '/reports', label: 'التقارير', icon: '📊' },
  { to: '/reviews', label: 'التقييمات', icon: '⭐' },
  { to: '/marketing-tools', label: 'الأدوات التسويقية', icon: '📣' },
  { to: '/payment-methods', label: 'وسائل الدفع', icon: '💳' },
  { to: '/delivery-cities', label: 'مدن التوصيل', icon: '🏙️' },
  { to: '/dashboard-users', label: 'المشرفين', icon: '👤' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
  { to: '/support', label: 'الدعم الفني', icon: '🛟' },
]

export default function AdminLayout() {
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()

  const links = allLinks.filter(l => {
    const perm = LINK_PERMS[l.to]
    return !perm || can(perm)
  })

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem' }}>💧</span> لمار
          </h2>
          <span className="sidebar-subtitle">لوحة التحكم</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((link, i) => (
            <NavLink key={link.to} to={'/admin' + link.to} end={link.to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="sidebar-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">مشرف</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">🚪 تسجيل خروج</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
