import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function StoreLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  const { login } = useAuth(); const navigate = useNavigate()

  async function handle(e) { e.preventDefault(); setError(''); try { await login(email, password); navigate('/') } catch (err) { setError(err.message) } }

  return (
    <div className="auth-page">
      <form onSubmit={handle} className="auth-card">
        <h2>تسجيل الدخول</h2>
        <p className="auth-subtitle">مرحباً بعودتك! أدخل بياناتك للمتابعة</p>
        {error && <div className="alert alert-error">{error}</div>}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" required />
        <button type="submit" className="btn btn-primary btn-block btn-lg">دخول</button>
        <div className="auth-footer">ليس لديك حساب؟ <Link to="/register">سجل الآن</Link></div>
      </form>
    </div>
  )
}
