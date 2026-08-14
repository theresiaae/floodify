import { useMemo, useRef, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
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
      map.flyTo([target.lat, target.lng], 16, { duration: 1.1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
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
      minZoom={11}
      maxZoom={17}
      scrollWheelZoom
      className="h-full w-full"
      maxBounds={bounds.pad(0.35)}
      maxBoundsViscosity={0.7}
      ref={mapRef}
    >
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

      {position && <Marker position={position} icon={markerIcon} />}
    </MapContainer>
  )
}
