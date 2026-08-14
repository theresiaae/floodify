/**
 * Pencarian lokasi (nama jalan/tempat) memakai Nominatim (OpenStreetMap) —
 * gratis, tanpa API key. Dibatasi ke bounding box Kota Denpasar lewat
 * `viewbox` + `bounded=1` supaya hasil yang muncul relevan. Ini cuma
 * penyaringan kasar (kotak, bukan bentuk asli kota) — validasi final tetap
 * pakai poligon batas asli (lihat handleSearchSelect di Prediksi.jsx).
 *
 * Catatan penggunaan: Nominatim membatasi ±1 request/detik dan melarang
 * traffic tinggi tanpa izin (usage policy OSM). Untuk skripsi/prototipe ini
 * aman karena sudah di-debounce di SearchBox. Kalau nanti dipakai untuk
 * traffic besar/production, pertimbangkan self-host Nominatim atau layanan
 * geocoding berbayar.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// left,top,right,bottom — dari bounds poligon Denpasar
const DENPASAR_VIEWBOX = '115.1737,-8.5916,115.2750,-8.7526'

export async function searchLocation(query) {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    viewbox: DENPASAR_VIEWBOX,
    bounded: '1',
    countrycodes: 'id',
  })

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { 'Accept-Language': 'id' },
  })

  if (!res.ok) {
    throw new Error('Gagal mencari lokasi.')
  }

  const data = await res.json()
  return data.map((item) => ({
    id: item.place_id,
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}