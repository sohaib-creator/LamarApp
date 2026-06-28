import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api'

export default function Categories() {
  const { can } = useAuth()
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name_ar: '', name_en: '' })

  function load() { getCategories().then(setCategories).catch(() => {}) }
  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm({ name_ar: '', name_en: '' }); setShowForm(true) }

  function openEdit(cat) { setEditing(cat); setForm({ name_ar: cat.name_ar, name_en: cat.name_en }); setShowForm(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) await updateCategory(editing.id, form)
      else await createCategory(form)
      setShowForm(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('تأكيد الحذف؟')) return
    try { await deleteCategory(id); load() } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>التصنيفات</h1>
        {can('categories.update') && <button className="btn btn-primary" onClick={openCreate}>إضافة تصنيف</button>}
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>عربي</th><th>English</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.name_ar}</td><td>{c.name_en}</td>
                <td><span className={`badge badge-${c.status ? 'success' : 'secondary'}`}>{c.status ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                  {can('categories.update') && <button className="btn btn-sm" onClick={() => openEdit(c)}>تعديل</button>}
                  {can('categories.update') && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>حذف</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل تصنيف' : 'إضافة تصنيف'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>الاسم (عربي)</label><input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} required /></div>
                <div className="form-group"><label>الاسم (إنجليزي)</label><input value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} required /></div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing ? 'حفظ' : 'إضافة'}</button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
