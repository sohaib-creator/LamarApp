import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getOrders, getOrder, updateOrderStatus, getDrivers, assignDriver, exportOrders } from '../api'
import * as XLSX from 'xlsx'
import DateInput from '../components/DateInput'

const statuses = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'preparing', label: 'قيد التحضير' },
  { value: 'out_for_delivery', label: 'في الطريق' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
]

const statusColors = {
  pending: 'warning', confirmed: 'info', preparing: 'info',
  out_for_delivery: 'primary', delivered: 'success', cancelled: 'danger',
}

const statusLabels = {}
statuses.forEach(s => { statusLabels[s.value] = s.label })

const ALL_FIELDS = [
  { key: 'order_number', label: 'رقم الطلب' },
  { key: 'customer_name', label: 'اسم العميل' },
  { key: 'customer_phone', label: 'رقم الجوال' },
  { key: 'status', label: 'الحالة' },
  { key: 'total', label: 'المبلغ' },
  { key: 'subtotal', label: 'المجموع الفرعي' },
  { key: 'delivery_fee', label: 'رسوم التوصيل' },
  { key: 'discount', label: 'الخصم' },
  { key: 'payment_method', label: 'طريقة الدفع' },
  { key: 'payment_status', label: 'حالة الدفع' },
  { key: 'notes', label: 'ملاحظات' },
  { key: 'driver_name', label: 'المندوب' },
  { key: 'address_city', label: 'المدينة' },
  { key: 'address_district', label: 'الحي' },
  { key: 'address_street', label: 'الشارع' },
  { key: 'created_at', label: 'تاريخ الطلب' },
  { key: 'delivered_at', label: 'تاريخ التوصيل' },
]

const DEFAULT_TEMPLATE = {
  name: 'قالب افتراضي',
  fields: ['order_number', 'customer_name', 'customer_phone', 'status', 'total', 'payment_method', 'driver_name', 'created_at'],
}

const STORAGE_KEY = 'lamar_export_templates'

function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : [DEFAULT_TEMPLATE]
  } catch { return [DEFAULT_TEMPLATE] }
}

function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function today() { return new Date().toISOString().split('T')[0] }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }
function prevMonthStart() { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1); return d.toISOString().split('T')[0] }
function prevMonthEnd() { const d = new Date(); d.setDate(0); return d.toISOString().split('T')[0] }

export default function Orders() {
  const { can } = useAuth()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState([])
  const [assigningId, setAssigningId] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const [templates, setTemplates] = useState(loadTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [selectedFields, setSelectedFields] = useState(DEFAULT_TEMPLATE.fields)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [templateName, setTemplateName] = useState('')
  const fileInputRef = useRef(null)

  function loadOrders() {
    setLoading(true)
    getOrders().then(data => { setOrders(data || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { loadOrders(); getDrivers().then(setDrivers).catch(() => {}) }, [])

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatus(orderId, newStatus)
      loadOrders()
      if (selectedOrder?.id === orderId) {
        const detail = await getOrder(orderId)
        setSelectedOrder(detail[0])
      }
    } catch (err) { alert(err.message) }
  }

  async function viewOrder(order) {
    try {
      const data = await getOrder(order.id)
      setSelectedOrder(data[0])
    } catch (err) { alert(err.message) }
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function sortIcon(field) {
    if (sortField !== field) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const filteredOrders = orders
    .filter(o => {
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') return ['pending','confirmed','preparing','out_for_delivery'].includes(o.status)
        if (filterStatus === 'done') return ['delivered','cancelled','returned'].includes(o.status)
        if (o.status !== filterStatus) return false
      }
      if (filterDateFrom && new Date(o.created_at) < new Date(filterDateFrom)) return false
      if (filterDateTo && new Date(o.created_at) > new Date(filterDateTo + ' 23:59:59')) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchNum = o.order_number?.toLowerCase().includes(q)
        const matchName = o.customer_name?.toLowerCase().includes(q)
        const matchPhone = o.customer_phone?.toLowerCase().includes(q)
        if (!matchNum && !matchName && !matchPhone) return false
      }
      return true
    })
    .sort((a, b) => {
      const va = a[sortField] ?? ''
      const vb = b[sortField] ?? ''
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })

  function applyTemplate(index) {
    const tpl = templates[index]
    if (!tpl) return
    setSelectedTemplate(index)
    setSelectedFields(tpl.fields)
  }

  function toggleField(key) {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  function saveTemplate() {
    const name = templateName.trim()
    if (!name) return alert('الرجاء إدخال اسم للقالب')
    const newTpl = { name, fields: selectedFields }
    const updated = templates.filter(t => t.name !== name).concat(newTpl)
    setTemplates(updated)
    saveTemplates(updated)
    setTemplateName('')
    alert('تم حفظ القالب بنجاح')
  }

  function deleteTemplate(index) {
    if (index === 0) return alert('لا يمكن حذف القالب الافتراضي')
    if (!confirm('حذف القالب؟')) return
    const updated = templates.filter((_, i) => i !== index)
    setTemplates(updated)
    saveTemplates(updated)
    if (selectedTemplate === index) {
      setSelectedTemplate(0)
      setSelectedFields(DEFAULT_TEMPLATE.fields)
    }
  }

  function importTemplate(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const tpl = JSON.parse(ev.target.result)
        if (!tpl.name || !Array.isArray(tpl.fields)) return alert('ملف قالب غير صالح')
        const updated = templates.filter(t => t.name !== tpl.name).concat(tpl)
        setTemplates(updated)
        saveTemplates(updated)
        setSelectedTemplate(updated.length - 1)
        setSelectedFields(tpl.fields)
        alert(`تم استيراد القالب "${tpl.name}"`)
      } catch { alert('فشل قراءة الملف') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function exportTemplate(index) {
    const tpl = templates[index]
    if (!tpl) return
    const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${tpl.name}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function setQuickRange(range) {
    const to = today()
    switch (range) {
      case 'today': setDateFrom(to); setDateTo(to); break
      case 'week': setDateFrom(daysAgo(7)); setDateTo(to); break
      case 'month': setDateFrom(monthStart()); setDateTo(to); break
      case 'lastMonth': setDateFrom(prevMonthStart()); setDateTo(prevMonthEnd()); break
      case 'all': setDateFrom(''); setDateTo(''); break
    }
  }

  async function handleExport() {
    if (selectedFields.length === 0) return alert('اختر حقل واحد على الأقل')
    setExporting(true)
    try {
      const data = await exportOrders(selectedFields, dateFrom || undefined, dateTo || undefined, statusFilter)
      if (!data || data.length === 0) return alert('لا توجد طلبات للتصدير')

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'الطلبات')
      ws['!dir'] = 'rtl'

      const filename = `الطلبات_${today()}${dateFrom ? `_${dateFrom}` : ''}${dateTo ? `_${dateTo}` : ''}.xlsx`
      XLSX.writeFile(wb, filename)
      setShowExport(false)
    } catch (err) { alert(err.message) }
    setExporting(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1>إدارة الطلبات</h1>
        {can('orders.view') && (
          <button className="btn btn-primary" onClick={() => { setShowExport(true); setSelectedFields(templates[selectedTemplate]?.fields || DEFAULT_TEMPLATE.fields) }}>
            📥 تصدير Excel
          </button>
        )}
      </div>

      <div className="card">
        <div className="orders-filter-bar">
          <input type="text" className="form-input" placeholder="🔍 بحث برقم الطلب أو اسم العميل..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
          <select className="form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">جميع الحالات</option>
            <option value="active">قيد التنفيذ</option>
            <option value="done">مكتمل/ملغي</option>
            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <DateInput value={filterDateFrom} onChange={setFilterDateFrom} placeholder="من" className="form-input" style={{ width: 140 }} />
          <DateInput value={filterDateTo} onChange={setFilterDateTo} placeholder="إلى" className="form-input" style={{ width: 140 }} />
          {(searchQuery || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
            <button className="btn btn-xs" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterDateFrom(''); setFilterDateTo('') }}>إعادة تعيين</button>
          )}
          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{filteredOrders.length} من {orders.length}</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('order_number')} style={{ cursor: 'pointer' }}>رقم الطلب{sortIcon('order_number')}</th>
              <th onClick={() => toggleSort('customer_name')} style={{ cursor: 'pointer' }}>العميل{sortIcon('customer_name')}</th>
              <th onClick={() => toggleSort('driver_name')} style={{ cursor: 'pointer' }}>المندوب{sortIcon('driver_name')}</th>
              <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer' }}>الحالة{sortIcon('status')}</th>
              <th onClick={() => toggleSort('total')} style={{ cursor: 'pointer' }}>المبلغ{sortIcon('total')}</th>
              <th>طريقة الدفع</th>
              <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>تاريخ{sortIcon('created_at')}</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.customer_name || `عميل #${order.user_id}`}</td>
                <td>
                  {order.driver_id ? (
                    <span>{order.driver_name || `مندوب #${order.driver_id}`}</span>
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )}
                </td>
                <td><span className={`badge badge-${statusColors[order.status] || 'secondary'}`}>{statusLabels[order.status] || order.status}</span></td>
                <td>{order.total} SAR</td>
                <td>{order.payment_method === 'cash' ? 'نقداً' : order.payment_method}</td>
                <td>{new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => viewOrder(order)}>عرض</button>
                  {can('orders.update') && (
                    <select className="form-select-sm" value="" onChange={e => { if (e.target.value) handleStatusChange(order.id, e.target.value) }}>
                      <option value="">تحديث</option>
                      {statuses.filter(s => s.value !== order.status).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && <tr><td colSpan="8" className="text-center">لا توجد طلبات</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>طلب #{selectedOrder.order_number}</h2>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>الحالة:</strong> <span className={`badge badge-${statusColors[selectedOrder.status]}`}>{statusLabels[selectedOrder.status]}</span></p>
              <p><strong>المجموع:</strong> {selectedOrder.total} SAR</p>
              <p><strong>طريقة الدفع:</strong> {selectedOrder.payment_method === 'cash' ? 'نقداً' : selectedOrder.payment_method}</p>
              <p><strong>المندوب:</strong> {selectedOrder.driver_id
                ? <span>{selectedOrder.driver_name || `مندوب #${selectedOrder.driver_id}`}</span>
                : <span style={{ color: '#f59e0b' }}>لم يعين بعد</span>}
              </p>
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && can('orders.assign') && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                  <select className="form-select-sm" value="" onChange={e => { if (e.target.value) setAssigningId(Number(e.target.value)) }} style={{ flex: 1 }}>
                    <option value="">اختيار مندوب</option>
                    {drivers.filter(d => d.status === 'active').map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {assigningId && (
                    <button className="btn btn-sm btn-primary" onClick={async () => {
                      try {
                        await assignDriver(selectedOrder.id, assigningId)
                        setAssigningId(null)
                        const detail = await getOrder(selectedOrder.id)
                        setSelectedOrder(detail[0])
                        loadOrders()
                      } catch (err) { alert(err.message) }
                    }}>تعيين</button>
                  )}
                </div>
              )}
              <p><strong>ملاحظات:</strong> {selectedOrder.notes || 'لا يوجد'}</p>
              <h3>المنتجات</h3>
              <table className="table">
                <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
                <tbody>
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.product_name_ar}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price} SAR</td>
                      <td>{item.total} SAR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3>سجل الحالة</h3>
              <div className="timeline">
                {selectedOrder.status_history?.map(h => (
                  <div key={h.id} className="timeline-item">
                    <div className="timeline-status">{statusLabels[h.status]}</div>
                    <div className="timeline-date">{new Date(h.created_at).toLocaleString('ar-SA')}</div>
                    {h.note && <div className="timeline-note">{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📥 تصدير الطلبات إلى Excel</h2>
              <button className="btn-close" onClick={() => setShowExport(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="export-section">
                <h3>القوالب</h3>
                <div className="export-template-row">
                  <select className="form-select" value={selectedTemplate} onChange={e => applyTemplate(Number(e.target.value))}>
                    {templates.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                  </select>
                  <button className="btn btn-sm" onClick={() => exportTemplate(selectedTemplate)} title="تصدير القالب">📤</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTemplate(selectedTemplate)} title="حذف القالب">🗑️</button>
                  <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} title="استيراد قالب">📂</button>
                  <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importTemplate} />
                </div>
              </div>

              <div className="export-section">
                <h3>اختر الحقول</h3>
                <div className="export-fields-grid">
                  {ALL_FIELDS.map(f => (
                    <label key={f.key} className="export-field-checkbox">
                      <input type="checkbox" checked={selectedFields.includes(f.key)} onChange={() => toggleField(f.key)} />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="export-section">
                <h3>الفترة الزمنية</h3>
                <div className="export-quick-row">
                  <button className="btn btn-xs" onClick={() => setQuickRange('today')}>اليوم</button>
                  <button className="btn btn-xs" onClick={() => setQuickRange('week')}>آخر ٧ أيام</button>
                  <button className="btn btn-xs" onClick={() => setQuickRange('month')}>هذا الشهر</button>
                  <button className="btn btn-xs" onClick={() => setQuickRange('lastMonth')}>الشهر الماضي</button>
                  <button className="btn btn-xs" onClick={() => setQuickRange('all')}>الكل</button>
                </div>
                <div className="export-date-row">
                  <label>من: <DateInput value={dateFrom} onChange={setDateFrom} className="form-input" placeholder="YYYY-MM-DD" /></label>
                  <label>إلى: <DateInput value={dateTo} onChange={setDateTo} className="form-input" placeholder="YYYY-MM-DD" /></label>
                </div>
              </div>

              <div className="export-section">
                <h3>حالة الطلب</h3>
                <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">جميع الحالات</option>
                  <option value="active">قيد التنفيذ</option>
                  {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="export-actions">
                <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                  {exporting ? 'جاري التصدير...' : '📥 تصدير Excel'}
                </button>
              </div>

              <hr />
              <div className="export-section">
                <h3>💾 حفظ كقالب</h3>
                <div className="export-save-row">
                  <input type="text" className="form-input" placeholder="اسم القالب الجديد" value={templateName} onChange={e => setTemplateName(e.target.value)} />
                  <button className="btn" onClick={saveTemplate}>حفظ القالب</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-lg { max-width: 700px; width: 90%; }
        .export-section { margin-bottom: 1.2rem; }
        .export-section h3 { font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-muted); }
        .export-template-row { display: flex; gap: 0.5rem; align-items: center; }
        .export-template-row .form-select { flex: 1; }
        .export-fields-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.4rem; }
        .export-field-checkbox { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer; padding: 0.25rem 0.4rem; border-radius: 4px; transition: background 0.15s; }
        .export-field-checkbox:hover { background: var(--hover-bg, #f1f5f9); }
        .export-field-checkbox input { accent-color: var(--primary, #2563eb); }
        .export-date-row { display: flex; gap: 1rem; margin-top: 0.5rem; }
        .export-date-row label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; }
        .export-date-row .form-input { width: auto; }
        .export-quick-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
        .btn-xs { padding: 0.25rem 0.6rem; font-size: 0.78rem; }
        .export-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .export-save-row { display: flex; gap: 0.5rem; align-items: center; }
        .export-save-row .form-input { flex: 1; }
      `}</style>
    </div>
  )
}
