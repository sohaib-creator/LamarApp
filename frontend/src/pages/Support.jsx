import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSupportTickets, getTicketReplies, replyTicket, updateTicketStatus } from '../api'

const statusLabels = { open: 'مفتوح', in_progress: 'قيد المعالجة', resolved: 'تم الحل', closed: 'مغلق' }
const statusColors = { open: 'danger', in_progress: 'warning', resolved: 'success', closed: 'secondary' }

export default function Support() {
  const { can } = useAuth()
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    getSupportTickets().then(setTickets).catch(() => {})
  }, [refresh])

  async function openTicket(t) {
    try {
      const data = await getTicketReplies(t.id)
      setSelected(data?.[0] || t)
    } catch { setSelected(t) }
  }

  async function handleReply() {
    if (!reply.trim() || !selected) return
    try {
      await replyTicket(selected.id, reply)
      setReply('')
      openTicket(selected)
    } catch (err) { alert(err.message) }
  }

  async function handleStatus(id, status) {
    try {
      await updateTicketStatus(id, status)
      setRefresh(r => r + 1)
      setSelected(null)
    } catch (err) { alert(err.message) }
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 100px)' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <h1>الدعم الفني</h1>
        <table className="table">
          <thead>
            <tr><th>#</th><th>الموضوع</th><th>المستخدم</th><th>الحالة</th><th>التاريخ</th><th></th></tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} className={selected?.id === t.id ? 'selected-row' : ''}>
                <td>{t.id}</td>
                <td>{t.subject}</td>
                <td>{t.user_id}</td>
                <td><span className={`badge badge-${statusColors[t.status]}`}>{statusLabels[t.status]}</span></td>
                <td>{new Date(t.created_at).toLocaleDateString('ar-SA')}</td>
                <td><button className="btn btn-sm btn-primary" onClick={() => openTicket(t)}>عرض</button></td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan="6" className="text-center">لا توجد تذاكر</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && (
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '1.5rem', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>{selected.subject}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {can('support.manage') && selected.status === 'open' && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(selected.id, 'in_progress')}>قيد المعالجة</button>}
              {can('support.manage') && ['open', 'in_progress'].includes(selected.status) && <button className="btn btn-sm btn-success" onClick={() => handleStatus(selected.id, 'resolved')}>حل</button>}
              <button className="btn btn-sm" onClick={() => setSelected(null)}>إغلاق</button>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            {selected.replies?.map(r => (
              <div key={r.id} style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: 8, marginBottom: '0.5rem' }}>
                <small style={{ color: '#64748b' }}>{r.user_name} · {new Date(r.created_at).toLocaleString('ar-SA')}</small>
                <p style={{ marginTop: '0.3rem' }}>{r.message}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="اكتب رداً..." rows={3}
              style={{ flex: 1, padding: '0.7rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem' }} />
            <button className="btn btn-primary" onClick={handleReply} style={{ alignSelf: 'flex-end' }}>إرسال</button>
          </div>
        </div>
      )}
    </div>
  )
}
