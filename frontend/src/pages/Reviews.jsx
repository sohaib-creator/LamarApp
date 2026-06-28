import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminReviews, moderateReview } from '../api'

export default function Reviews() {
  const { can } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [actionId, setActionId] = useState(null)

  useEffect(() => { loadReviews() }, [filter])

  async function loadReviews() {
    setLoading(true)
    try {
      const data = await getAdminReviews(filter || undefined)
      setReviews(data || [])
    } catch {} finally { setLoading(false) }
  }

  async function handleModerate(id, status) {
    setActionId(id)
    try {
      await moderateReview(id, status)
      setReviews(reviews.map(r => r.id === id ? { ...r, status } : r))
    } catch {} finally { setActionId(null) }
  }

  const statusColors = { approved: 'success', pending: 'warning', rejected: 'danger' }
  const statusLabels = { approved: 'مقبول', pending: 'بانتظار المراجعة', rejected: 'مرفوض' }

  return (
    <div>
      <h1>تقييمات المنتجات</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(s)}>
              {s ? statusLabels[s] : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card">جاري التحميل...</div>
      ) : reviews.length === 0 ? (
        <div className="card"><p className="text-center" style={{ color: '#999' }}>لا توجد تقييمات</p></div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>المنتج</th><th>المستخدم</th><th>التقييم</th><th>التعليق</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.product_name}</td>
                  <td>{r.user_name}</td>
                  <td>
                    <span dir="ltr">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ color: i <= r.rating ? '#f59e0b' : '#ddd', fontSize: '1.1rem' }}>
                          {i <= r.rating ? '\u2605' : '\u2606'}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.comment || '-'}
                  </td>
                  <td><span className={`badge badge-${statusColors[r.status]}`}>{statusLabels[r.status]}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    {can('reviews.manage') && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {r.status !== 'approved' && (
                          <button className="btn btn-sm" style={{ background: '#16a34a', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            disabled={actionId === r.id} onClick={() => handleModerate(r.id, 'approved')}>
                            قبول
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            disabled={actionId === r.id} onClick={() => handleModerate(r.id, 'rejected')}>
                            رفض
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
