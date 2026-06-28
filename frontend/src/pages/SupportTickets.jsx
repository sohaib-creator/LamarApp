import { useState, useEffect } from 'react'

const statusMap = { open: 'مفتوح', in_progress: 'قيد المعالجة', resolved: 'تم الحل', closed: 'مغلق' }

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')

  useEffect(() => {
    fetch('/api/support/tickets', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(d => { if (d.success) setTickets(d.data) }).catch(() => {})
  }, [])

  async function loadTicket(id) {
    const r = await fetch(`/api/support/tickets/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    const d = await r.json()
    if (d.success) setSelected(d.data[0])
  }

  async function sendReply() {
    if (!reply.trim()) return
    const r = await fetch(`/api/support/tickets/${selected.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ message: reply }),
    })
    const d = await r.json()
    if (d.success) { setReply(''); loadTicket(selected.id) }
  }

  async function changeStatus(id, status) {
    const r = await fetch(`/api/support/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ status }),
    })
    const d = await r.json()
    if (d.success) { setTickets(tickets.map(t => t.id === id ? { ...t, status } : t)); if (selected?.id === id) loadTicket(id) }
  }

  return (
    <div>
      <div className="page-header"><h1>الدعم الفني</h1></div>
      <div className="split-layout">
        <div className="split-pane">
          <div className="card">
            {tickets.map(t => (
              <div key={t.id} className={`ticket-row ${selected?.id === t.id ? 'active' : ''}`} onClick={() => loadTicket(t.id)}>
                <div className="ticket-row-header"><strong>#{t.id}</strong><span className={`badge badge-${t.status === 'resolved' ? 'success' : 'warning'}`}>{statusMap[t.status]}</span></div>
                <div>{t.subject}</div>
                <div className="ticket-row-date">{new Date(t.created_at).toLocaleDateString('ar-SA')}</div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-center">لا توجد تذاكر</p>}
          </div>
        </div>
        <div className="split-pane">
          {selected ? (
            <div className="card">
              <div className="ticket-detail-header">
                <h2>{selected.subject}</h2>
                <div className="ticket-actions">
                  {selected.status !== 'resolved' && <button className="btn btn-sm btn-success" onClick={() => changeStatus(selected.id, 'resolved')}>حل</button>}
                  {selected.status !== 'in_progress' && <button className="btn btn-sm" onClick={() => changeStatus(selected.id, 'in_progress')}>قيد المعالجة</button>}
                </div>
              </div>
              <div className="ticket-replies">
                {(selected.replies || []).map(r => (
                  <div key={r.id} className={`reply ${r.user_id === selected.user_id ? 'user' : 'admin'}`}>
                    <div className="reply-author">{r.user_name || 'مستخدم'}</div>
                    <div className="reply-text">{r.message}</div>
                    <div className="reply-date">{new Date(r.created_at).toLocaleString('ar-SA')}</div>
                  </div>
                ))}
              </div>
              <div className="reply-form">
                <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="اكتب رداً..." rows="3" />
                <button className="btn btn-primary" onClick={sendReply}>إرسال</button>
              </div>
            </div>
          ) : <p className="text-center">اختر تذكرة لعرض التفاصيل</p>}
        </div>
      </div>
    </div>
  )
}
