import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  if (!user) return <div className="empty-state"><div className="empty-icon">🔒</div><h2>يرجى تسجيل الدخول</h2><Link to="/login" className="btn btn-primary">دخول</Link></div>

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">{user.name?.charAt(0) || 'U'}</div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        {user.phone && <p style={{ marginTop: '0.3rem' }}>{user.phone}</p>}
      </div>
      <div className="profile-links">
        <Link to="/orders" className="btn btn-outline btn-block btn-lg">📦 طلباتي</Link>
        <button className="btn btn-block btn-lg" style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={logout}>تسجيل خروج</button>
      </div>
    </div>
  )
}
