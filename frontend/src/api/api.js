const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(message)
  }
  return res.json()
}

/**
 * Mengambil seluruh parameter (curah hujan real-time/forecast + data GEE) untuk
 * satu titik koordinat pada tanggal tertentu. Nilainya disiapkan di backend,
 * tidak ditampilkan ke user.
 * @param {string} [date] - format 'YYYY-MM-DD'. Kosongkan untuk hari ini.
 */
export async function fetchParameters(lat, lng, date) {
  const res = await fetch(`${BASE_URL}/parameters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, date }),
  })
  return handleResponse(res)
}

/**
 * Mengirim titik koordinat + tanggal ke backend untuk dijalankan lewat model
 * Random Forest. Backend akan mengambil ulang parameter (atau memakai cache
 * dari fetchParameters) lalu mengembalikan status dan probabilitas.
 * @param {string} [date] - format 'YYYY-MM-DD'. Kosongkan untuk hari ini.
 */
export async function predictFlood(lat, lng, date) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, date }),
  })
  return handleResponse(res)
}