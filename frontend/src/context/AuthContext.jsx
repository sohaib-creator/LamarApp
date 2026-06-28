import { createContext, useState, useEffect, useContext, useMemo } from 'react'
import { login as apiLogin, register as apiRegister, getProfile } from '../api'

function parsePerms(p) {
  if (!p) return []
  if (Array.isArray(p)) return p
  try { const r = JSON.parse(p); return Array.isArray(r) ? r : [] } catch { return [] }
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getProfile()
        .then(data => {
          if (data[0]) {
            data[0].permissions = parsePerms(data[0].permissions)
            setUser(data[0])
          }
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const data = await apiLogin(email, password)
    localStorage.setItem('token', data[0].token)
    data[0].user.permissions = parsePerms(data[0].user.permissions)
    setUser(data[0].user)
    return data[0].user
  }

  async function register(name, email, password, phone) {
    const data = await apiRegister(name, email, password, phone)
    localStorage.setItem('token', data[0].token)
    setUser(data[0].user)
    return data[0].user
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  const can = useMemo(() => {
    return (permission) => {
      const perms = user?.permissions || []
      if (perms.includes('*')) return true
      return perms.includes(permission)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
