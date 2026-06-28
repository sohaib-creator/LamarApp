import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import DateInput from '../components/DateInput'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const API = ''

async function api(endpoint, opts = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${endpoint}`, { ...opts, headers })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

function fmt(n) { return Number(n || 0).toFixed(2) }
function today() { return new Date().toISOString().split('T')[0] }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }
function prevMonthStart() { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1); return d.toISOString().split('T')[0] }
function prevMonthEnd() { const d = new Date(); d.setDate(0); return d.toISOString().split('T')[0] }

function miniStat(label, value, color, sub) {
  return (
    <div className="report-mini-stat">
      <div className="report-mini-label">{label}</div>
      <div className="report-mini-value" style={{ color }}>{value}</div>
      {sub && <div className="report-mini-sub">{sub}</div>}
    </div>
  )
}

function PeriodBar({ value, onChange }) {
  const periods = [
    { key: '7days', label: '٧ أيام' },
    { key: '30days', label: '٣٠ يوم' },
    { key: 'month', label: 'هذا الشهر' },
    { key: 'lastMonth', label: 'الشهر الماضي' },
  ]
  return (
    <div className="period-tabs" style={{ marginBottom: 0 }}>
      {periods.map(p => (
        <button key={p.key} className={`period-tab ${value === p.key ? 'active' : ''}`} onClick={() => onChange(p.key)}>{p.label}</button>
      ))}
    </div>
  )
}

function getPeriodRange(key) {
  const now = new Date(); const to = today()
  switch (key) {
    case '7days': return { start: daysAgo(7), end: to }
    case '30days': return { start: daysAgo(30), end: to }
    case 'month': return { start: monthStart(), end: to }
    case 'lastMonth': return { start: prevMonthStart(), end: prevMonthEnd() }
    default: return { start: daysAgo(30), end: to }
  }
}

function Overview({ start, end }) {
  const [data, setData] = useState([])
  const [prevData, setPrevData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const rangeDays = 30
    const s = start || daysAgo(rangeDays)
    const e = end || today()
    const daysDiff = Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1
    const ps = new Date(s); ps.setDate(ps.getDate() - daysDiff)
    const pe = new Date(s); pe.setDate(pe.getDate() - 1)

    Promise.all([
      api(`/api/reports/sales-overview?start=${s}&end=${e}`).catch(() => []),
      api(`/api/reports/sales-overview?start=${ps.toISOString().split('T')[0]}&end=${pe.toISOString().split('T')[0]}`).catch(() => []),
    ]).then(([curr, prev]) => {
      setData(curr); setPrevData(prev); setLoading(false)
    })
  }, [start, end])

  const totalRevenue = data.reduce((s, d) => s + Number(d.revenue || 0), 0)
  const totalOrders = data.reduce((s, d) => s + Number(d.orders_count || 0), 0)
  const prevRevenue = prevData.reduce((s, d) => s + Number(d.revenue || 0), 0)
  const prevOrders = prevData.reduce((s, d) => s + Number(d.orders_count || 0), 0)
  const revChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null
  const ordChange = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders * 100).toFixed(1) : null
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' })),
    datasets: [{
      label: 'الإيرادات',
      data: data.map(d => Number(d.revenue || 0)),
      borderColor: '#059669',
      backgroundColor: 'rgba(5,150,105,0.12)',
      fill: true, tension: 0.35,
      pointBackgroundColor: '#059669', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4,
    }]
  }

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', cornerRadius: 8, padding: 10 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, callback: v => v + ' SAR' } }
    }
  }

  if (loading) return <div className="loading">جاري التحميل...</div>

  return (
    <div>
      <div className="report-comparison-row">
        {miniStat('إجمالي الإيرادات', `${fmt(totalRevenue)} SAR`, '#059669', revChange !== null ? `${revChange > 0 ? '▲' : '▼'} ${Math.abs(revChange)}% عن الفترة الماضية` : null)}
        {miniStat('إجمالي الطلبات', totalOrders, '#2563eb', ordChange !== null ? `${ordChange > 0 ? '▲' : '▼'} ${Math.abs(ordChange)}% عن الفترة الماضية` : null)}
        {miniStat('متوسط قيمة الطلب', `${fmt(avgOrder)} SAR`, '#f59e0b', null)}
        {miniStat('أعلى يوم', data.length > 0 ? `${fmt(Math.max(...data.map(d => Number(d.revenue || 0))))} SAR` : '0', '#7c3aed', null)}
      </div>

      <div className="report-chart-box">
        <h4>📈 الإيرادات اليومية</h4>
        <div className="report-chart-container">
          {data.length > 0 ? <Line data={chartData} options={chartOptions} /> : <div className="chart-empty">لا توجد بيانات كافية</div>}
        </div>
      </div>

      <div className="report-chart-box">
        <h4>📊 عدد الطلبات اليومية</h4>
        <div className="report-chart-container" style={{ height: 200 }}>
          {data.length > 0 ? (
            <Bar data={{
              labels: data.map(d => new Date(d.date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' })),
              datasets: [{
                label: 'الطلبات', data: data.map(d => Number(d.orders_count || 0)),
                backgroundColor: '#2563eb', borderRadius: 4,
              }]
            }} options={{ ...chartOptions, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
          ) : <div className="chart-empty">لا توجد بيانات كافية</div>}
        </div>
      </div>
    </div>
  )
}

function CategorySales({ start, end }) {
  const [data, setData] = useState([])
  useEffect(() => { api(`/api/reports/sales-by-category${qs(start, end)}`).then(setData).catch(() => {}) }, [start, end])

  const chartData = {
    labels: data.map(d => d.name_ar),
    datasets: [{
      label: 'المبيعات', data: data.map(d => Number(d.total_sales || 0)),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'],
      borderRadius: 4,
    }]
  }

  return (
    <div>
      <div className="report-chart-box">
        <h4>📦 المبيعات حسب التصنيف</h4>
        <div className="report-chart-container" style={{ height: Math.max(200, data.length * 40) }}>
          {data.length > 0 ? (
            <Bar data={chartData} options={{
              responsive: true, maintainAspectRatio: false, indexAxis: 'y',
              plugins: { legend: { display: false } },
              scales: { x: { beginAtZero: true, grid: { color: '#f1f5f9' } }, y: { grid: { display: false } } }
            }} />
          ) : <div className="chart-empty">لا توجد بيانات</div>}
        </div>
      </div>
      <div className="table-wrapper" style={{ marginTop: 12 }}>
        <table className="table"><thead><tr><th>التصنيف</th><th>الطلبات</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
          <tbody>{data.map(d => <tr key={d.id}><td>{d.name_ar}</td><td>{d.orders_count}</td><td>{d.items_sold}</td><td>{fmt(d.total_sales)} SAR</td></tr>)}
            {data.length === 0 && <tr><td colSpan="4" className="text-center" style={{ color: '#999' }}>لا توجد بيانات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductSales({ start, end }) {
  const [data, setData] = useState([])
  useEffect(() => { api(`/api/reports/sales-by-product${qs(start, end)}`).then(setData).catch(() => {}) }, [start, end])
  return (
    <div>
      <div className="table-wrapper">
        <table className="table"><thead><tr><th>المنتج</th><th>التصنيف</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
          <tbody>{data.map(d => <tr key={d.id}><td>{d.name_ar}</td><td>{d.category_name || '-'}</td><td>{d.items_sold}</td><td>{fmt(d.total_sales)} SAR</td></tr>)}
            {data.length === 0 && <tr><td colSpan="4" className="text-center" style={{ color: '#999' }}>لا توجد بيانات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DriverSales({ start, end }) {
  const [data, setData] = useState([])
  useEffect(() => { api(`/api/reports/sales-by-driver${qs(start, end)}`).then(setData).catch(() => {}) }, [start, end])
  const maxVal = Math.max(...data.map(d => Number(d.total_delivered || 0)), 1)
  return (
    <div>
      {data.map(d => (
        <div key={d.id} className="report-bar"><span className="report-bar-label">{d.name}</span>
          <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${(Number(d.total_delivered || 0) / maxVal) * 100}%`, background: '#f59e0b' }} /></div>
          <span className="report-bar-value">{fmt(d.total_delivered)} SAR ({d.deliveries_count} طلب)</span>
        </div>
      ))}
      {data.length === 0 && <p style={{ color: '#999' }}>لا توجد بيانات</p>}
    </div>
  )
}

function TopCust({ start, end }) {
  const [data, setData] = useState([])
  useEffect(() => { api(`/api/reports/top-customers${qs(start, end)}`).then(setData).catch(() => {}) }, [start, end])
  const maxVal = Math.max(...data.map(d => Number(d.total_spent || 0)), 1)
  return (
    <div>
      {data.map(d => (
        <div key={d.id} className="report-bar"><span className="report-bar-label">{d.name} ({d.orders_count} طلب)</span>
          <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${(Number(d.total_spent || 0) / maxVal) * 100}%`, background: '#8b5cf6' }} /></div>
          <span className="report-bar-value">{fmt(d.total_spent)} SAR</span>
        </div>
      ))}
      {data.length === 0 && <p style={{ color: '#999' }}>لا توجد بيانات</p>}
    </div>
  )
}

function MonthWinners() {
  const months = ['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const now = new Date()
  const [m, setM] = useState(now.getMonth() + 1)
  const [y, setY] = useState(now.getFullYear())
  const [drivers, setDrivers] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    api(`/api/reports/driver-of-month?year=${y}&month=${String(m).padStart(2,'0')}`).then(setDrivers).catch(() => {})
    api(`/api/reports/customer-of-month?year=${y}&month=${String(m).padStart(2,'0')}`).then(setCustomers).catch(() => {})
  }, [m, y])

  return (
    <div>
      <div className="report-winner-select">
        <select value={m} onChange={e => setM(Number(e.target.value))}>
          {months.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
        <select value={y} onChange={e => setY(Number(e.target.value))}>
          {[y - 1, y, y + 1].map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
      <div className="report-winner-grid">
        <div className="card"><h4>🥇 أفضل مندوب</h4>
          {drivers.length > 0 ? <div className="report-winner-card"><div className="report-winner-icon">🏆</div><div className="report-winner-name">{drivers[0].name}</div><div className="report-winner-sub">{drivers[0].deliveries_count} طلب - {fmt(drivers[0].total_delivered)} SAR</div></div>
            : <p style={{ color: '#999', textAlign: 'center' }}>لا توجد بيانات</p>}
          {drivers.slice(1).map((d, i) => <div key={d.id} className="report-winner-list-item"><span>#{i + 2} {d.name}</span><span>{d.deliveries_count} طلب - {fmt(d.total_delivered)} SAR</span></div>)}
        </div>
        <div className="card"><h4>👑 أفضل عميل</h4>
          {customers.length > 0 ? <div className="report-winner-card"><div className="report-winner-icon">👑</div><div className="report-winner-name">{customers[0].name}</div><div className="report-winner-sub">{customers[0].orders_count} طلب - {fmt(customers[0].total_spent)} SAR</div></div>
            : <p style={{ color: '#999', textAlign: 'center' }}>لا توجد بيانات</p>}
          {customers.slice(1).map((d, i) => <div key={d.id} className="report-winner-list-item"><span>#{i + 2} {d.name}</span><span>{d.orders_count} طلب - {fmt(d.total_spent)} SAR</span></div>)}
        </div>
      </div>
    </div>
  )
}

function qs(start, end) {
  if (start && end) return `?start=${start}&end=${end}`
  return ''
}

export default function Reports() {
  const tabs = [
    { id: 'overview', label: '📊 نظرة عامة', comp: Overview },
    { id: 'category', label: '📦 حسب التصنيف', comp: CategorySales },
    { id: 'product', label: '💧 حسب المنتج', comp: ProductSales },
    { id: 'driver', label: '🚚 حسب المندوب', comp: DriverSales },
    { id: 'customers', label: '👑 العملاء', comp: TopCust },
    { id: 'monthly', label: '🏆 الشهر', comp: MonthWinners },
  ]
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod] = useState('30days')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const printRef = useRef(null)
  const ActiveComp = tabs.find(t => t.id === activeTab)?.comp || Overview

  useEffect(() => {
    if (!start && !end) {
      const range = getPeriodRange(period)
      setStart(range.start); setEnd(range.end)
    }
  }, [period])

  function handlePeriodChange(key) {
    setPeriod(key)
    const range = getPeriodRange(key)
    setStart(range.start); setEnd(range.end)
  }

  return (
    <div ref={printRef}>
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>📊 التقارير</h1>
          <button className="btn btn-sm" onClick={() => window.print()}>🖨️ طباعة / PDF</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {activeTab === 'overview' && <PeriodBar value={period} onChange={handlePeriodChange} />}
          {activeTab !== 'monthly' && activeTab !== 'overview' && (
            <>
              <DateInput value={start} onChange={setStart} className="form-input" style={{ width: 150 }} placeholder="من" />
              <span style={{ color: '#64748b' }}>إلى</span>
              <DateInput value={end} onChange={setEnd} className="form-input" style={{ width: 150 }} placeholder="إلى" />
              {(start || end) && <button className="btn btn-xs" onClick={() => { setStart(''); setEnd(''); setPeriod('30days') }}>إعادة تعيين</button>}
            </>
          )}
        </div>
      </div>

      <div className="report-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`report-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <ActiveComp start={start} end={end} />
      </div>
    </div>
  )
}
