import { useState } from 'react'
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
  { to: '/', label: 'الإحصائيات', icon: '<img src="/images/grid-fill.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/orders', label: 'الطلبات', icon: '<img src="/images/box-seam.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/products', label: 'المنتجات', icon: '<img src="/images/droplet.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/categories', label: 'التصنيفات', icon: '<img src="/images/folder.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/users', label: 'العملاء', icon: '<img src="/images/people.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/drivers', label: 'المندوبين', icon: '<img src="/images/truck.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/reports', label: 'التقارير', icon: '<img src="/images/grid-fill.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/reviews', label: 'التقييمات', icon: '<img src="/images/star.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/marketing-tools', label: 'الأدوات التسويقية', icon: '<img src="/images/megaphone.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/payment-methods', label: 'وسائل الدفع', icon: '<img src="/images/credit-card.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/delivery-cities', label: 'مدن التوصيل', icon: '<img src="/images/building.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/dashboard-users', label: 'المشرفين', icon: '<img src="/images/person-badge.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/settings', label: 'الإعدادات', icon: '<img src="/images/gear.svg" alt="" style="width:20px;height:20px" />' },
  { to: '/support', label: 'الدعم الفني', icon: '<img src="/images/chat-dots.svg" alt="" style="width:20px;height:20px" />' },
]

export default function AdminLayout() {
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/images/logo.svg" alt="Lamar" style={{width:28,height:28}} /> لمار
          </h2>
          <span className="sidebar-subtitle">لوحة التحكم</span>
          <button className="sidebar-close-mobile" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {links.map((link, i) => (
            <NavLink key={link.to} to={'/admin' + link.to} end={link.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="sidebar-icon" dangerouslySetInnerHTML={{ __html: link.icon }} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar"><img src="/images/avatar.svg" alt="" style={{width:32,height:32,borderRadius:'50%'}} /></div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">مشرف</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn"><img src="/images/box-arrow-right.svg" alt="" style={{width:20,height:20}} /> تسجيل خروج</button>
        </div>
      </aside>
      <main className="main-content">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        <Outlet />
      </main>
    </div>
  )
}
