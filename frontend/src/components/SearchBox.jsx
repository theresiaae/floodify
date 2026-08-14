import { useState, useEffect, useRef } from 'react'
import { Search, MapPinned, Loader2 } from 'lucide-react'
import { searchLocation } from '../api/geocode'

const DEBOUNCE_MS = 450
const MIN_QUERY_LENGTH = 3

export default function SearchBox({ onSelectResult }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLocation(query)
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Tutup dropdown kalau klik di luar search box.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (result) => {
    setQuery(result.label)
    setOpen(false)
    setResults([])
    onSelectResult(result)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-deep-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur">
        {loading ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-deep-500" />
        ) : (
          <Search size={16} className="shrink-0 text-deep-500" />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Cari jalan atau tempat di Denpasar..."
          className="w-full bg-transparent text-sm text-deep-900 outline-none placeholder:text-deep-800/40"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="rise-in absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-deep-200 bg-white shadow-lg">
          {results.map((result) => (
            <li key={result.id}>
              <button
                onClick={() => handleSelect(result)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-deep-800 hover:bg-sage-100"
              >
                <MapPinned size={15} className="mt-0.5 shrink-0 text-deep-500" />
                <span className="line-clamp-2">{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
        <div className="rise-in absolute left-0 right-0 top-full z-[1000] mt-1.5 rounded-xl border border-deep-200 bg-white px-3 py-2.5 text-xs text-deep-800/50 shadow-lg">
          Lokasi tidak ditemukan di Denpasar.
        </div>
      )}
    </div>
  )
}