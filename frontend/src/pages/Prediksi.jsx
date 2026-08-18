import { useState, useCallback, useRef, useEffect } from 'react'
import {
  MapPin,
  Search,
  Loader2,
  AlertTriangle,
  Droplets,
  CalendarDays,
  LocateFixed,
  CloudRain,
  Mountain,
  Sprout,
  Building2,
} from 'lucide-react'
import MapView from '../components/MapView'
import SearchBox from '../components/SearchBox'
import RiskGauge, { levelFromStatus } from '../components/RiskGauge'
import { fetchParameters, predictFlood } from '../api/api'
import { isPointInPolygon } from '../utils/geo'
import { DENPASAR_BOUNDARY } from '../data/denpasarBoundary'

const MAX_FORECAST_DAYS_AHEAD = 15

const LAND_COVER_LABELS = {
  10: 'Pohon / Hutan',
  20: 'Semak Belukar',
  30: 'Padang Rumput',
  40: 'Pertanian / Sawah',
  50: 'Lahan Terbangun',
  60: 'Lahan Terbuka',
  70: 'Salju / Es',
  80: 'Badan Air',
  90: 'Lahan Basah',
  95: 'Hutan Mangrove',
  100: 'Lumut / Lichen',
}

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
  const [parameters, setParameters] = useState(null)
  const [loadingParams, setLoadingParams] = useState(false)
  const [loadingPredict, setLoadingPredict] = useState(false)
  const [locating, setLocating] = useState(false)
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
      setFlyTarget({ lat: result.lat, lng: result.lng, ts: Date.now() })
    },
    [handleOutsideClick]
  )

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung deteksi lokasi (Geolocation).')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (!isPointInPolygon(lat, lng, DENPASAR_BOUNDARY)) {
          handleOutsideClick()
          return
        }
        setPosition({ lat, lng })
        setResult(null)
        setFlyTarget({ lat, lng, ts: Date.now() })
      },
      (err) => {
        setLocating(false)
        let msg = 'Gagal mendeteksi lokasi saat ini.'
        if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh browser.'
        else if (err.code === 2) msg = 'Posisi GPS tidak dapat ditemukan.'
        else if (err.code === 3) msg = 'Waktu permintaan lokasi habis (timeout).'
        setError(msg)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [handleOutsideClick])

  // Ambil ulang parameter setiap kali lokasi ATAU tanggal berubah.
  useEffect(() => {
    if (!position) return

    let cancelled = false
    setResult(null)
    setError(null)
    setParamsReady(false)
    setParameters(null)
    setLoadingParams(true)

    fetchParameters(position.lat, position.lng, date)
      .then((data) => {
        if (!cancelled) {
          setParamsReady(true)
          if (data?.parameters) {
            setParameters(data.parameters)
          }
        }
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
      if (data?.parameters) {
        setParameters(data.parameters)
      }
    } catch (err) {
      setError(err.message || 'Gagal menjalankan prediksi.')
    } finally {
      setLoadingPredict(false)
    }
  }

  const level = result ? levelFromStatus(result.status) : 'aman'
  const isFutureDate = date > TODAY_STR

  return (
    <div className="mx-auto flex max-w-[1580px] w-full flex-col gap-4 sm:gap-5 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 lg:h-[calc(100vh-76px)] lg:flex-row">
      {/* Map panel */}
      <div className="relative h-[440px] sm:h-[520px] lg:h-full w-full lg:flex-1 overflow-hidden rounded-2xl sm:rounded-3xl border border-deep-200 bg-[#dfeef0] shadow-sm">
        <MapView
          position={position ? [position.lat, position.lng] : null}
          flyTarget={flyTarget}
          onSelect={handleSelect}
          onOutsideClick={handleOutsideClick}
        />

        <div className="pointer-events-none absolute left-4 top-4 z-[1000] hidden md:block rounded-xl border border-deep-200 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur">
          <p className="font-display text-base font-semibold text-deep-900">Peta Kota Denpasar</p>
          <p className="text-sm text-deep-800/80">Klik di dalam batas wilayah untuk memilih lokasi</p>
        </div>

        <div className="absolute left-3 right-3 sm:left-auto sm:right-4 top-3 sm:top-4 z-[1000] sm:w-80">
          <SearchBox onSelectResult={handleSearchSelect} />
        </div>

        {/* Bottom-left GPS Location button */}
        <div className="absolute left-3.5 sm:left-4 bottom-4 z-[1000]">
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className="flex items-center gap-2 rounded-xl border border-deep-200/80 bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-deep-900 shadow-md backdrop-blur transition-all duration-200 hover:bg-white hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-75 cursor-pointer"
            title="Gunakan lokasi GPS saya saat ini"
          >
            {locating ? (
              <Loader2 size={16} className="animate-spin text-deep-600" />
            ) : (
              <LocateFixed size={16} className="text-[#0f4c5c]" />
            )}
            <span className="hidden sm:inline">Lokasi Saya</span>
          </button>
        </div>

        {outsideWarning && (
          <div className="rise-in absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-alert-high px-4 py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg whitespace-nowrap">
            <AlertTriangle size={17} />
            Titik ini di luar wilayah Kota Denpasar
          </div>
        )}
      </div>

      {/* Control / result panel */}
      <aside className="flex w-full flex-col gap-3.5 sm:gap-4 lg:w-[380px] xl:w-[420px] shrink-0 lg:overflow-y-auto lg:pr-1">
        {/* Tanggal Prediksi Card */}
        <div className="rounded-2xl border border-deep-200 bg-white/80 p-4 sm:p-5 shadow-sm">
          <p className="mb-2.5 sm:mb-3 text-sm font-semibold uppercase tracking-wider text-deep-800">
            Tanggal Prediksi
          </p>
          <label className="flex items-center gap-2.5 rounded-xl border border-deep-200 bg-sage-100 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-deep-500/20">
            <CalendarDays size={18} className="text-deep-700 shrink-0" />
            <input
              type="date"
              value={date}
              min={MIN_DATE_STR}
              max={MAX_DATE_STR}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent font-mono text-base font-medium text-deep-900 outline-none"
            />
          </label>
          <p className="mt-2.5 text-sm leading-relaxed text-deep-800/80">
            {isFutureDate
              ? `Tanggal ke depan: curah hujan pakai data forecast, sedangkan NDVI & kelembapan tanah tetap memakai citra satelit terbaru yang tersedia (belum ada citra untuk tanggal ini).`
              : `Tanggal hari ini atau lampau: seluruh parameter memakai data observasi historis.`}
          </p>
        </div>

        {/* Lokasi Terpilih Card */}
        <div className="rounded-2xl border border-deep-200 bg-white/80 p-4 sm:p-5 shadow-sm">
          <p className="mb-2.5 sm:mb-3 text-sm font-semibold uppercase tracking-wider text-deep-800">
            Lokasi Terpilih
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-deep-200/60 bg-sage-100 px-3.5 py-2.5">
              <p className="text-xs sm:text-sm font-medium text-deep-800/75">Latitude</p>
              <p className="font-mono text-base font-semibold text-deep-900 truncate mt-0.5">
                {position ? position.lat.toFixed(4) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-deep-200/60 bg-sage-100 px-3.5 py-2.5">
              <p className="text-xs sm:text-sm font-medium text-deep-800/75">Longitude</p>
              <p className="font-mono text-base font-semibold text-deep-900 truncate mt-0.5">
                {position ? position.lng.toFixed(4) : '—'}
              </p>
            </div>
          </div>

          {position && (
            <div className="mt-3.5">
              <div className="flex items-center gap-2 text-sm text-deep-900">
                {loadingParams ? (
                  <span className="flex items-center gap-2 text-deep-700">
                    <Loader2 size={15} className="animate-spin shrink-0 text-deep-600" /> Mengambil parameter elevasi, tutupan lahan, NDVI, kelembapan &amp; curah hujan...
                  </span>
                ) : paramsReady ? (
                  <span className="flex items-center gap-2 text-deep-900 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-alert-low shrink-0 ring-2 ring-alert-low/20" />
                    Parameter lokasi siap digunakan
                  </span>
                ) : null}
              </div>

              {/* Informative 5 Parameter Grid */}
              {paramsReady && parameters && (
                <div className="rise-in mt-3 space-y-2 rounded-xl border border-deep-200/80 bg-sage-50/70 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-deep-800">
                      Parameter Lingkungan
                    </p>
                    <span className="text-xs text-deep-800/70">GEE &amp; Weather</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 rounded-lg bg-white/90 p-2 shadow-2xs">
                      <CloudRain size={17} className="shrink-0 text-sky-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-deep-800/75">Curah Hujan</p>
                        <p className="font-semibold text-deep-900 truncate">
                          {parameters.curah_hujan != null ? `${parameters.curah_hujan.toFixed(1)} mm` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-white/90 p-2 shadow-2xs">
                      <Mountain size={17} className="shrink-0 text-amber-700" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-deep-800/75">Elevasi</p>
                        <p className="font-semibold text-deep-900 truncate">
                          {parameters.elevasi != null ? `${parameters.elevasi.toFixed(1)} m dpl` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-white/90 p-2 shadow-2xs">
                      <Sprout size={17} className="shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-deep-800/75">NDVI (Vegetasi)</p>
                        <p className="font-semibold text-deep-900 truncate">
                          {parameters.ndvi != null ? parameters.ndvi.toFixed(2) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-white/90 p-2 shadow-2xs">
                      <Droplets size={17} className="shrink-0 text-teal-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-deep-800/75">Kelembapan</p>
                        <p className="font-semibold text-deep-900 truncate">
                          {parameters.kelembapan_tanah != null
                            ? `${(parameters.kelembapan_tanah * 100).toFixed(1)}%`
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 rounded-lg bg-white/90 p-2 shadow-2xs">
                      <Building2 size={17} className="shrink-0 text-indigo-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-deep-800/75">Tutupan Lahan</p>
                        <p
                          className="font-semibold text-deep-900 truncate"
                          title={LAND_COVER_LABELS[parameters.tutupan_lahan] || `Kode ${parameters.tutupan_lahan}`}
                        >
                          {LAND_COVER_LABELS[parameters.tutupan_lahan] || `Kode ${parameters.tutupan_lahan}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={!position || loadingParams || loadingPredict}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-deep-900 px-4 py-3.5 text-base font-semibold text-sand transition-colors duration-200 hover:bg-deep-800 disabled:cursor-not-allowed disabled:bg-deep-300 disabled:text-deep-700/60 cursor-pointer shadow-sm"
          >
            {loadingPredict ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Search size={17} />
            )}
            Prediksi Sekarang
          </button>

          {!position && (
            <p className="mt-2.5 flex items-center gap-1.5 text-sm text-deep-800/75">
              <MapPin size={14} className="shrink-0" /> Pilih titik pada peta terlebih dahulu
            </p>
          )}

          {error && (
            <p className="mt-2.5 rounded-lg bg-alert-high/10 px-3.5 py-2.5 text-sm text-alert-high font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Hasil Prediksi Card */}
        <div className="rounded-2xl border border-deep-200 bg-white/80 p-4 sm:p-5 shadow-sm">
          <p className="mb-3 sm:mb-4 text-sm font-semibold uppercase tracking-wider text-deep-800">
            Hasil Prediksi
          </p>

          {result ? (
            <div className="rise-in flex items-center gap-4">
              <RiskGauge probability={result.probabilitas} level={level} />
              <div>
                <p className="text-sm font-medium text-deep-800/75">Status</p>
                <p
                  className="font-display text-xl sm:text-2xl font-semibold"
                  style={{
                    color:
                      level === 'rawan' ? '#c1543a' : level === 'waspada' ? '#d99a3c' : '#4d8f6f',
                  }}
                >
                  {result.status}
                </p>
                {result.catatan && (
                  <p className="mt-1.5 text-sm leading-snug text-deep-800/80">
                    {result.catatan}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-deep-100/70 px-3.5 py-4 text-sm sm:text-base text-deep-800/75 font-medium">
              <Droplets size={22} className="shrink-0 text-deep-500" />
              Belum ada hasil. Pilih lokasi lalu klik &ldquo;Prediksi Sekarang&rdquo;.
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}