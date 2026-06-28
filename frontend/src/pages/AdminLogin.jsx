import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@lamarapp.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role === 'admin') navigate('/admin')
      else setError('هذا الحساب ليس مشرفاً')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💧</div>
          <h1 style={{ background: 'linear-gradient(135deg, var(--primary), #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>لمار</h1>
          <p>لوحة التحكم</p>
        </div>
        <form onSubmit={handleSubmit} style={{ animation: 'slideUp 0.6s ease 0.2s both' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group" style={{ animation: 'slideUp 0.5s ease 0.3s both' }}>
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@lamarapp.com" required />
          </div>
          <div className="form-group" style={{ animation: 'slideUp 0.5s ease 0.4s both' }}>
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}
            style={{ animation: 'slideUp 0.5s ease 0.5s both' }}>
            {loading ? <><span className="loading-spinner" style={{ marginLeft: 8 }} /> جاري تسجيل الدخول...</> : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
