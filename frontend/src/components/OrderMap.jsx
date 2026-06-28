import { useEffect, useRef } from 'react'

export default function OrderMap({ lat, lng, street, city }) {
  const mapRef = useRef(null)
  const mapInit = useRef(false)

  useEffect(() => {
    if (!mapRef.current || mapInit.current || !lat || !lng) return
    mapInit.current = true
    const map = L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomleft' }).addTo(map)
    L.marker([lat, lng]).addTo(map).bindPopup(street ? `${street}, ${city}` : 'موقع التوصيل').openPopup()
    return () => { map.remove(); mapInit.current = false }
  }, [lat, lng])

  if (!lat || !lng) return null

  return <div ref={mapRef} style={{ height: 200, borderRadius: 12, marginTop: '0.5rem', zIndex: 1 }}></div>
}
