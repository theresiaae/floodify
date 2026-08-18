import { useState, useEffect, useRef } from 'react'
import { Search, MapPinned, Loader2, X } from 'lucide-react'
import { searchLocation } from '../api/geocode'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 3

export default function SearchBox({ onSelectResult }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)
  const suppressSearchRef = useRef(false)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // If query change was triggered by selecting a result item, skip searching
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false
      return
    }

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([])
      setLoading(false)
      setOpen(false)
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
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
    suppressSearchRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery(result.label)
    setOpen(false)
    setResults([])
    setLoading(false)
    onSelectResult(result)
  }

  const handleClear = () => {
    suppressSearchRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setResults([])
    setOpen(false)
    setLoading(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2.5 rounded-xl border border-deep-200 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur">
        {loading ? (
          <Loader2 size={18} className="shrink-0 animate-spin text-deep-600" />
        ) : (
          <Search size={18} className="shrink-0 text-deep-600" />
        )}
        <input
          value={query}
          onChange={(e) => {
            suppressSearchRef.current = false
            setQuery(e.target.value)
          }}
          onFocus={() => {
            if (results.length > 0 && !suppressSearchRef.current) {
              setOpen(true)
            }
          }}
          placeholder="Cari jalan atau tempat di Denpasar..."
          className="w-full bg-transparent text-base text-deep-900 outline-none placeholder:text-deep-800/50 font-body"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-deep-400 hover:bg-deep-100 hover:text-deep-700 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="rise-in absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-deep-200 bg-white shadow-lg">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(result)
                }}
                onClick={() => handleSelect(result)}
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm sm:text-base text-deep-800 hover:bg-sage-100 transition-colors"
              >
                <MapPinned size={17} className="mt-0.5 shrink-0 text-deep-500" />
                <span className="line-clamp-2">{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
        <div className="rise-in absolute left-0 right-0 top-full z-[1000] mt-1.5 rounded-xl border border-deep-200 bg-white px-3.5 py-2.5 text-sm text-deep-800/70 shadow-lg">
          Lokasi tidak ditemukan di Denpasar.
        </div>
      )}
    </div>
  )
}