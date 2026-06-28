import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'

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

export default function Users() {
  const { can } = useAuth()
  const [customers, setCustomers] = useState([])

  useEffect(() => { api('/api/admin/customers').then(setCustomers).catch(() => {}) }, [])

  function exportExcel() {
    const data = customers.map((c, i) => ({
      '#': i + 1,
      'الاسم': c.name,
      'البريد الإلكتروني': c.email,
      'الجوال': c.phone || '',
      'الحالة': c.status === 'active' ? 'نشط' : 'موقوف',
      'تاريخ التسجيل': new Date(c.created_at).toLocaleDateString('ar-SA'),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'العملاء')
    ws['!dir'] = 'rtl'
    XLSX.writeFile(wb, 'العملاء.xlsx')
  }

  function importExcel(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
        if (rows.length < 2) return alert('الملف فارغ')
        rows.shift()
        const customers = rows.map(r => {
          if (!r[0] && !r[1]) return null
          return { name: String(r[0] || '').trim(), email: String(r[1] || '').trim(), phone: String(r[2] || '').trim(), status: 'active' }
        }).filter(Boolean)
        if (customers.length === 0) return alert('لا توجد بيانات صالحة')
        const result = await api('/api/admin/customers/import', {
          method: 'POST',
          body: JSON.stringify({ customers }),
        })
        alert(`تم استيراد ${result[0]?.imported || 0} عميل بنجاح`)
        setCustomers(await api('/api/admin/customers'))
      } catch (err) { alert(err.message) }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function handleStatus(id, status) {
    try {
      await api(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      setCustomers(customers.map(u => u.id === id ? { ...u, status } : u))
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>العملاء</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {can('users.view') && <button className="btn btn-success" onClick={exportExcel}>📥 تصدير إكسل</button>}
          {can('users.update') && (
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              📤 استيراد إكسل
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={importExcel} />
            </label>
          )}
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>#</th><th>الاسم</th><th>البريد</th><th>الجوال</th><th>الحالة</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {customers.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td><span className={`badge badge-${u.status === 'active' ? 'success' : 'danger'}`}>{u.status === 'active' ? 'نشط' : 'موقوف'}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                  {can('users.update') && (u.status === 'active' ? (
                    <button className="btn btn-sm btn-danger" onClick={() => handleStatus(u.id, 'inactive')}>حظر</button>
                  ) : (
                    <button className="btn btn-sm btn-success" onClick={() => handleStatus(u.id, 'active')}>تفعيل</button>
                  ))}
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan="7" className="text-center">لا يوجد عملاء</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
