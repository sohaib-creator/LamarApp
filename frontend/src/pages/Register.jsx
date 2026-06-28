import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  const { register } = useAuth(); const navigate = useNavigate()

  async function handle(e) { e.preventDefault(); setError(''); try { await register(name, email, password, phone); navigate('/') } catch (err) { setError(err.message) } }

  return (
    <div className="auth-page">
      <form onSubmit={handle} className="auth-card">
        <h2>إنشاء حساب جديد</h2>
        <p className="auth-subtitle">انضم إلينا واستمتع بأفضل خدمات المياه</p>
        {error && <div className="alert alert-error">{error}</div>}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل" required />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" required />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الجوال (اختياري)" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" required />
        <button type="submit" className="btn btn-primary btn-block btn-lg">تسجيل</button>
        <div className="auth-footer">لديك حساب؟ <Link to="/login">تسجيل دخول</Link></div>
      </form>
    </div>
  )
}
