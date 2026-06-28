import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, uploadImage } from '../api'

const API = ''

export default function Products() {
  const { can } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ category_id: '', name_ar: '', name_en: '', price: '', old_price: '', size_liters: '', stock: '', description: '', image: '', images: [] })
  const [stockLoading, setStockLoading] = useState({})
  const [uploading, setUploading] = useState(false)

  async function quickStock(id, delta) {
    const p = products.find(x => x.id === id)
    if (!p) return
    const newStock = Math.max(0, parseInt(p.stock) + delta)
    setStockLoading(s => ({ ...s, [id]: true }))
    try {
      await updateProduct(id, { ...p, stock: newStock, category_id: p.category_id })
      setProducts(products.map(x => x.id === id ? { ...x, stock: newStock } : x))
    } catch (err) { alert(err.message) }
    finally { setStockLoading(s => ({ ...s, [id]: false })) }
  }

  function load() {
    getProducts().then(setProducts).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ category_id: categories[0]?.id || '', name_ar: '', name_en: '', price: '', old_price: '', size_liters: '', stock: '', description: '', image: '', images: [] })
    setShowForm(true)
  }

  function openEdit(product) {
    let imgs = []
    try { imgs = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []) } catch { imgs = [] }
    setEditing(product)
    setForm({ category_id: product.category_id || '', name_ar: product.name_ar, name_en: product.name_en, price: product.price, old_price: product.old_price || '', size_liters: product.size_liters || '', stock: product.stock, description: product.description || '', image: product.image || '', images: imgs })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = { ...form, images: form.images.filter(Boolean) }
      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setShowForm(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('تأكيد حذف المنتج؟')) return
    try {
      await deleteProduct(id)
      load()
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>إدارة المنتجات</h1>
        {can('products.update') && <button className="btn btn-primary" onClick={openCreate}>إضافة منتج</button>}
      </div>
      <div className="card">
        <table className="table products-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الاسم</th>
              <th>التصنيف</th>
              <th>السعر</th>
              <th>الحجم</th>
              <th>المخزون</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const imgUrl = p.image || (Array.isArray(p.images) ? p.images[0] : null)
              return (
              <tr key={p.id}>
                <td>
                  {imgUrl ? (
                    <img src={imgUrl.startsWith('http') ? imgUrl : `${API}${imgUrl}`} alt={p.name_ar}
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                      onError={e => { e.target.style.display = 'none' }} />
                  ) : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📷</div>}
                </td>
                <td>{p.name_ar}<br /><small>{p.name_en}</small></td>
                <td>{p.category_name_ar || '-'}</td>
                <td>{p.price} SAR{p.old_price ? <><br /><del>{p.old_price} SAR</del></> : ''}</td>
                <td>{p.size_liters ? `${p.size_liters} لتر` : '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {can('products.update') && <button className="btn btn-sm" style={{ width: 28, height: 28, padding: 0, borderRadius: '50%' }} onClick={() => quickStock(p.id, 1)} disabled={stockLoading[p.id]}>+</button>}
                    <span style={{ fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{p.stock}</span>
                    {can('products.update') && <button className="btn btn-sm" style={{ width: 28, height: 28, padding: 0, borderRadius: '50%' }} onClick={() => quickStock(p.id, -1)} disabled={stockLoading[p.id] || p.stock <= 0}>-</button>}
                  </div>
                </td>
                <td><span className={`badge badge-${p.status ? 'success' : 'secondary'}`}>{p.status ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                  {can('products.update') && <button className="btn btn-sm" onClick={() => openEdit(p)}>تعديل</button>}
                  {can('products.update') && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>حذف</button>}
                </td>
              </tr>
              )})}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل منتج' : 'إضافة منتج'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>التصنيف</label>
                  <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                    <option value="">بدون تصنيف</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>الاسم (عربي)</label><input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} required /></div>
                  <div className="form-group"><label>الاسم (إنجليزي)</label><input value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>السعر</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                  <div className="form-group"><label>السعر القديم</label><input type="number" step="0.01" value={form.old_price} onChange={e => setForm({...form, old_price: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>الحجم (لتر)</label><input type="number" step="0.01" value={form.size_liters} onChange={e => setForm({...form, size_liters: e.target.value})} /></div>
                  <div className="form-group"><label>المخزون</label><input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>الوصف</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2"></textarea></div>
                <div className="form-group">
                  <label>الصورة الرئيسية</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {form.image ? (
                      <>
                        <img src={form.image.startsWith('http') ? form.image : `${API}${form.image}`} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setForm({...form, image: ''})}>إزالة</button>
                      </>
                    ) : (
                      <label className="btn btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {uploading ? 'جاري الرفع...' : '📁 اختيار صورة'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          disabled={uploading}
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploading(true)
                            try {
                              const url = await uploadImage(file)
                              setForm({...form, image: url})
                            } catch (err) { alert(err.message) }
                            setUploading(false)
                            e.target.value = ''
                          }} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>صور إضافية</label>
                  {form.images.map((img, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                      {img && <img src={img.startsWith('http') ? img : `${API}${img}`} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', border: '1px solid #e2e8f0' }} />}
                      <label className="btn btn-xs" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                        📁 اختيار
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              const url = await uploadImage(file)
                              const imgs = [...form.images]
                              imgs[i] = url
                              setForm({...form, images: imgs})
                            } catch (err) { alert(err.message) }
                            e.target.value = ''
                          }} />
                      </label>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => setForm({...form, images: form.images.filter((_, j) => j !== i)})} style={{ padding: '2px 6px', fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-xs" onClick={() => setForm({...form, images: [...form.images, '']})}>+ إضافة صورة</button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing ? 'حفظ التعديلات' : 'إضافة'}</button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
