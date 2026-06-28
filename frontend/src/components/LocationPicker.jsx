import { useEffect, useRef } from 'react'

export default function LocationPicker({ lat, lng, onLocationChange, height = '250px' }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const marker = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const hasLocation = lat && lng
    const center = hasLocation ? [lat, lng] : [24.7136, 46.6753]
    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, hasLocation ? 15 : 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomleft' }).addTo(map)
    mapInstance.current = map
    if (hasLocation) {
      marker.current = L.marker(center, { draggable: true }).addTo(map)
      marker.current.on('dragend', () => {
        const pos = marker.current.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })
    }
    map.on('click', (e) => {
      if (marker.current) marker.current.setLatLng(e.latlng)
      else { marker.current = L.marker(e.latlng, { draggable: true }).addTo(map); marker.current.on('dragend', () => { const p = marker.current.getLatLng(); onLocationChange(p.lat, p.lng) }) }
      onLocationChange(e.latlng.lat, e.latlng.lng)
    })
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  function getLocation() {
    if (!navigator.geolocation) return alert('الموقع غير مدعوم في هذا المتصفح')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude
        const map = mapInstance.current
        if (!map) return
        map.setView([lat, lng], 16)
        if (marker.current) marker.current.setLatLng([lat, lng])
        else { marker.current = L.marker([lat, lng], { draggable: true }).addTo(map); marker.current.on('dragend', () => { const p = marker.current.getLatLng(); onLocationChange(p.lat, p.lng) }) }
        onLocationChange(lat, lng)
      },
      () => alert('تعذر الحصول على الموقع. تأكد من تفعيل GPS'),
      { enableHighAccuracy: true }
    )
  }

  return (
    <div>
      <div ref={mapRef} style={{ height, borderRadius: 12, marginBottom: '0.5rem', zIndex: 1 }}></div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={getLocation} style={{ marginBottom: '0.5rem' }}>
        📍 تحديد موقعي الحالي
      </button>
      {lat && lng && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>📍 {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}</div>}
    </div>
  )
}
