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
    <div class="relative flex items-center justify-center" style="width:32px;height:32px;">
      <span class="pulse-ring absolute inline-block rounded-full" style="width:20px;height:20px;background:#2699b0;"></span>
      <span class="floodify-marker relative inline-block rounded-full border-[3px] border-white shadow-lg" style="width:18px;height:18px;background:#0f4c5c;"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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
    <div className="relative h-full w-full">
      <MapContainer
        center={DENPASAR_CENTER}
        zoom={12}
        minZoom={10}
        maxZoom={20}
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
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {/* Dim everything outside Kota Denpasar using an even-odd mask polygon */}
        <Polygon
          positions={maskPositions}
          pathOptions={{
            fillColor: '#1e3a47',
            fillOpacity: 0.26,
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
            color: '#0f4c5c',
            weight: 3,
            fill: false,
            dashArray: '6 6',
          }}
          interactive={false}
        />

        <ClickCatcher onInside={onSelect} onOutside={onOutsideClick} />
        <FlyToHandler target={flyTarget} />
        <MapResizer />

        {position && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
    </div>
  )
}
