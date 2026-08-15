import { useMemo, useRef, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { DENPASAR_BOUNDARY } from '../data/denpasarBoundary'
import { isPointInPolygon, WORLD_RING } from '../utils/geo'

const DENPASAR_CENTER = [-8.65, 115.2167]

const markerIcon = L.divIcon({
  className: '',
  html: `
    <div class="relative flex items-center justify-center" style="width:26px;height:26px;">
      <span class="pulse-ring absolute inline-block rounded-full" style="width:14px;height:14px;background:#146678;"></span>
      <span class="floodify-marker relative inline-block rounded-full border-2 border-white" style="width:14px;height:14px;background:#0f4c5c;"></span>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

function ClickCatcher({ onInside, onOutside }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      if (isPointInPolygon(lat, lng, DENPASAR_BOUNDARY)) {
        onInside(lat, lng)
      } else {
        onOutside()
      }
    },
  })
  return null
}

function FlyToHandler({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 15, { duration: 1.1 })
    }
  }, [map, target])
  return null
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    const container = map.getContainer()

    let resizeObserver = null
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })
      resizeObserver.observe(container)
    }

    const t1 = setTimeout(() => map.invalidateSize(), 100)
    const t2 = setTimeout(() => map.invalidateSize(), 400)
    const t3 = setTimeout(() => map.invalidateSize(), 1000)

    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      window.removeEventListener('resize', handleResize)
    }
  }, [map])
  return null
}

export default function MapView({ position, flyTarget, onSelect, onOutsideClick }) {
  const bounds = useMemo(() => L.latLngBounds(DENPASAR_BOUNDARY), [])
  const maskPositions = useMemo(() => [WORLD_RING, DENPASAR_BOUNDARY], [])
  const mapRef = useRef(null)

  return (
    <MapContainer
      center={DENPASAR_CENTER}
      zoom={12}
      minZoom={10}
      maxZoom={18}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
      style={{ width: '100%', height: '100%' }}
      maxBounds={bounds.pad(1.2)}
      maxBoundsViscosity={0.5}
      ref={mapRef}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Dim everything outside Kota Denpasar using an even-odd mask polygon */}
      <Polygon
        positions={maskPositions}
        pathOptions={{
          fillColor: '#0a3040',
          fillOpacity: 0.45,
          stroke: false,
          fillRule: 'evenodd',
          interactive: false,
          className: 'mask-outside',
        }}
      />

      {/* Denpasar boundary outline */}
      <Polygon
        positions={DENPASAR_BOUNDARY}
        pathOptions={{
          color: '#607a63',
          weight: 2,
          fill: false,
          dashArray: '4 5',
        }}
        interactive={false}
      />

      <ClickCatcher onInside={onSelect} onOutside={onOutsideClick} />
      <FlyToHandler target={flyTarget} />
      <MapResizer />

      {position && <Marker position={position} icon={markerIcon} />}
    </MapContainer>
  )
}
