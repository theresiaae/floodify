# Floodify — Website Prediksi Risiko Banjir Kota Denpasar

Struktur proyek:

```
floodify/
├── frontend/   React + Vite + Tailwind + Leaflet
└── backend/    Flask (GEE + Visual Crossing + model Random Forest)
```

## 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env     # sesuaikan VITE_API_BASE_URL kalau backend tidak di localhost:5000
npm run dev
```

- Peta dibatasi memakai poligon batas administratif Kota Denpasar asli
  (sumber: GADM v4.0, via repo `mahendrayudha/indonesia-geojson`), sudah
  disederhanakan dengan Shapely supaya ringan di browser. File ada di
  `src/data/denpasarBoundary.js`.
- Klik di luar poligon akan menampilkan peringatan dan tidak mengisi
  koordinat. Area di luar Denpasar juga digelapkan di peta (mask polygon)
  supaya jelas secara visual mana yang bisa diklik.
- Saat titik dipilih, frontend otomatis memanggil `/api/parameters` di
  belakang layar (curah hujan + 4 parameter GEE) — nilainya tidak
  ditampilkan di UI, sesuai wireframe kamu. Tombol "Prediksi Sekarang"
  baru memanggil `/api/predict` dan menampilkan status + probabilitas.

## 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # isi API key & kredensial GEE
```

Isi `.env`:
- `VISUALCROSSING_API_KEY` — API key dari visualcrossing.com.
- `GEE_SERVICE_ACCOUNT_EMAIL` + `GEE_SERVICE_ACCOUNT_KEY_PATH` — kalau mau
  pakai service account (disarankan). Kalau dikosongkan, kode akan pakai
  Application Default Credentials — jalankan `earthengine authenticate`
  sekali di mesin ini sebelum `flask run`.

Taruh model hasil skripsi di `backend/model/model_rf_terbaik.pkl`
(hasil `joblib.dump(model, ...)` dari Colab kamu).

Jalankan:
```bash
python app.py
```

## ⚠️ Hal yang WAJIB dicek sebelum dipakai untuk skripsi/publikasi

1. **Tutupan lahan: ESA WorldCover vs ESRI Annual Land Cover.**
   Catatan proyek kamu menyebut model dilatih dengan fitur `tutupan_lahan`
   dari **ESRI Annual Land Cover**, tapi permintaan di pesan ini minta
   sumber **ESA WorldCover**. Kode kelas kedua skema ini berbeda (misalnya
   kode "lahan terbangun" tidak sama angkanya), jadi backend
   (`services/predict_service.py`) sudah saya kasih `LAND_COVER_MAP` untuk
   memetakan kode ESA WorldCover ke kode yang **kamu perkirakan** dipakai
   ESRI — **ini masih perlu kamu cek dan sesuaikan** dengan mapping kelas
   yang benar-benar dipakai saat training, atau kalau lebih simpel, latih
   ulang model dengan fitur ESA WorldCover supaya konsisten dengan
   deployment. Tanpa ini, prediksi bisa salah walau kelima parameter lain
   sudah benar.
2. **Nama kolom & urutan fitur** di `predict_service.py`
   (`FEATURE_ORDER`) mengikuti catatan skripsi kamu — cek lagi apakah
   nama kolom persis sama dengan yang dipakai saat `model.fit()` di Colab
   (termasuk urutan One-Hot Encoding kalau `tutupan_lahan` di-encode,
   bukan dipakai sebagai angka mentah).
3. **Poligon batas Denpasar** yang dipakai sudah dari sumber resmi (GADM),
   tapi sudah disederhanakan (~makin sedikit titik) supaya ringan — cukup
   akurat untuk keperluan UI, tapi bukan pengganti data BIG resmi kalau
   dibutuhkan presisi survei.
4. Endpoint GEE (`gee_service.py`) memanggil Earth Engine secara sinkron
   tiap klik pengguna, yang bisa memakan waktu beberapa detik — sudah
   ditampilkan sebagai status loading di UI, tapi pertimbangkan caching
   per grid/kelurahan kalau traffic tinggi.
