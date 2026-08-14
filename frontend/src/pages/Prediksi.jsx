import { useState, useCallback, useRef, useEffect } from 'react'
import { MapPin, Search, Loader2, AlertTriangle, Droplets, CalendarDays } from 'lucide-react'
import MapView from '../components/MapView'
import SearchBox from '../components/SearchBox'
import RiskGauge, { levelFromStatus } from '../components/RiskGauge'
import { fetchParameters, predictFlood } from '../api/api'
import { isPointInPolygon } from '../utils/geo'
import { DENPASAR_BOUNDARY } from '../data/denpasarBoundary'

const MAX_FORECAST_DAYS_AHEAD = 15

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

const TODAY_STR = toISODate(new Date())
const MAX_DATE_STR = toISODate(
  new Date(Date.now() + MAX_FORECAST_DAYS_AHEAD * 24 * 60 * 60 * 1000)
)
// Landsat 8 (sumber NDVI) baru tersedia sejak awal 2013 — batas historis wajar.
const MIN_DATE_STR = '2015-01-01'

export default function Prediksi() {
  const [position, setPosition] = useState(null) // { lat, lng }
  const [flyTarget, setFlyTarget] = useState(null)
  const [date, setDate] = useState(TODAY_STR)
  const [paramsReady, setParamsReady] = useState(false)
  const [loadingParams, setLoadingParams] = useState(false)
  const [loadingPredict, setLoadingPredict] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [outsideWarning, setOutsideWarning] = useState(false)
  const warningTimer = useRef(null)

  const handleSelect = useCallback((lat, lng) => {
    setPosition({ lat, lng })
    setResult(null)
  }, [])

  const handleOutsideClick = useCallback(() => {
    setOutsideWarning(true)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setOutsideWarning(false), 2600)
  }, [])


  const handleSearchSelect = useCallback(
    (result) => {
      if (!isPointInPolygon(result.lat, result.lng, DENPASAR_BOUNDARY)) {
        handleOutsideClick()
        return
      }
      setPosition({ lat: result.lat, lng: result.lng })
      setResult(null)
      setFlyTarget({ lat: result.lat, lng: result.lng })
    },
    [handleOutsideClick]
  )

  // Ambil ulang parameter setiap kali lokasi ATAU tanggal berubah.
  // Curah hujan (historis/forecast) dan window NDVI/kelembapan tanah di
  // backend mengikuti tanggal ini.
  useEffect(() => {
    if (!position) return

    let cancelled = false
    setResult(null)
    setError(null)
    setParamsReady(false)
    setLoadingParams(true)

    fetchParameters(position.lat, position.lng, date)
      .then(() => {
        if (!cancelled) setParamsReady(true)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Gagal mengambil parameter lokasi.')
      })
      .finally(() => {
        if (!cancelled) setLoadingParams(false)
      })

    return () => {
      cancelled = true
    }
  }, [position, date])

  const handlePredict = async () => {
    if (!position) return
    setLoadingPredict(true)
    setError(null)
    try {
      const data = await predictFlood(position.lat, position.lng, date)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Gagal menjalankan prediksi.')
    } finally {
      setLoadingPredict(false)
    }
  }

  const level = result ? levelFromStatus(result.status) : 'aman'
  const isFutureDate = date > TODAY_STR

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6 lg:h-[calc(100vh-70px)] lg:flex-row">
      {/* Map panel */}
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-deep-200 shadow-sm" style={{ minHeight: 420 }}>
        <MapView position={position ? [position.lat, position.lng] : null} onSelect={handleSelect} onOutsideClick={handleOutsideClick} />

        <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-xl bg-white/90 px-3.5 py-2 shadow-sm backdrop-blur">
          <p className="font-display text-sm font-semibold text-deep-900">Peta Kota Denpasar</p>
          <p className="text-xs text-deep-800/60">Klik di dalam batas wilayah untuk memilih lokasi</p>
        </div>

        <div className="absolute right-4 top-4 z-[1000] w-full max-w-[280px] sm:max-w-xs">
          <SearchBox onSelectResult={handleSearchSelect} />
        </div>

        {outsideWarning && (
          <div className="rise-in absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-alert-high px-4 py-2 text-sm font-medium text-white shadow-lg">
            <AlertTriangle size={16} />
            Titik ini di luar wilayah Kota Denpasar
          </div>
        )}
      </div>

      {/* Control / result panel */}
      <aside className="flex w-full flex-col gap-4 lg:w-[340px] lg:overflow-y-auto lg:pr-1">
        <div className="rounded-2xl border border-deep-200 bg-white/80 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-deep-700/60">
            Tanggal Prediksi
          </p>
          <label className="flex items-center gap-2.5 rounded-xl border border-deep-200 bg-sage-100 px-3 py-2.5">
            <CalendarDays size={16} className="text-deep-700" />
            <input
              type="date"
              value={date}
              min={MIN_DATE_STR}
              max={MAX_DATE_STR}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent font-mono text-sm text-deep-900 outline-none"
            />
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-deep-800/50">
            {isFutureDate
              ? `Tanggal ke depan: curah hujan pakai data forecast, sedangkan NDVI & kelembapan tanah tetap memakai citra satelit terbaru yang tersedia (belum ada citra untuk tanggal ini).`
              : `Tanggal hari ini atau lampau: seluruh parameter memakai data observasi historis.`}
          </p>
        </div>

        <div className="rounded-2xl border border-deep-200 bg-white/80 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-deep-700/60">
            Lokasi Terpilih
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-sage-100 px-3 py-2.5">
              <p className="text-[11px] text-deep-800/60">Latitude</p>
              <p className="font-mono text-sm text-deep-900">
                {position ? position.lat.toFixed(4) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-sage-100 px-3 py-2.5">
              <p className="text-[11px] text-deep-800/60">Longitude</p>
              <p className="font-mono text-sm text-deep-900">
                {position ? position.lng.toFixed(4) : '—'}
              </p>
            </div>
          </div>

          {position && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-deep-800/60">
              {loadingParams ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Mengambil data elevasi, tutupan
                  lahan, NDVI, kelembapan tanah &amp; curah hujan untuk tanggal ini...
                </>
              ) : paramsReady ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-alert-low" /> Parameter lokasi
                  siap digunakan
                </>
              ) : null}
            </p>
          )}

          <button
            onClick={handlePredict}
            disabled={!position || loadingParams || loadingPredict}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-deep-900 px-4 py-3 text-sm font-semibold text-sand transition-colors duration-200 hover:bg-deep-800 disabled:cursor-not-allowed disabled:bg-deep-300 disabled:text-deep-700/60"
          >
            {loadingPredict ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Prediksi Sekarang
          </button>

          {!position && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-deep-800/50">
              <MapPin size={13} /> Pilih titik pada peta terlebih dahulu
            </p>
          )}

          {error && (
            <p className="mt-2.5 rounded-lg bg-alert-high/10 px-3 py-2 text-xs text-alert-high">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-deep-200 bg-white/80 p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-deep-700/60">
            Hasil Prediksi
          </p>

          {result ? (
            <div className="rise-in flex items-center gap-4">
              <RiskGauge probability={result.probabilitas} level={level} />
              <div>
                <p className="text-[11px] text-deep-800/60">Status</p>
                <p
                  className="font-display text-lg font-semibold"
                  style={{
                    color:
                      level === 'rawan' ? '#c1543a' : level === 'waspada' ? '#d99a3c' : '#4d8f6f',
                  }}
                >
                  {result.status}
                </p>
                {result.catatan && (
                  <p className="mt-1 max-w-[150px] text-xs leading-snug text-deep-800/60">
                    {result.catatan}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-deep-100/70 px-3.5 py-4 text-sm text-deep-800/50">
              <Droplets size={20} className="shrink-0 text-deep-400" />
              Belum ada hasil. Pilih lokasi lalu klik &ldquo;Prediksi Sekarang&rdquo;.
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}