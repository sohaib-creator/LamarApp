import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  if (!user) return <div className="empty-state"><div className="empty-icon"><img src="/images/lock.svg" alt="" style={{width:18,height:18}} /></div><h2>يرجى تسجيل الدخول</h2><Link to="/login" className="btn btn-primary">دخول</Link></div>

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover'}} />
          ) : (
            <img src="/images/avatar.svg" alt="" style={{width:80,height:80}} />
          )}
        </div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        {user.phone && <p style={{ marginTop: '0.3rem' }}>{user.phone}</p>}
      </div>
      <div className="profile-links">
        <Link to="/orders" className="btn btn-outline btn-block btn-lg"><img src="/images/box-seam.svg" alt="" style={{width:18,height:18}} /> طلباتي</Link>
        <button className="btn btn-block btn-lg" style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={logout}>تسجيل خروج</button>
      </div>
    </div>
  )
}
