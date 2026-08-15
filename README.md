# 🌊 Floodify — Prediksi Risiko Banjir Kota Denpasar

**Floodify** adalah platform web interaktif dan edukatif yang dirancang untuk memetakan serta memprediksi potensi risiko banjir di wilayah Kota Denpasar secara spasial.

Aplikasi ini mengintegrasikan data penginderaan jauh (*remote sensing*), data cuaca, dan pemodelan kecerdasan buatan (*Machine Learning*) untuk memberikan gambaran tingkat kerawanan banjir yang mudah dipahami oleh masyarakat umum maupun akademisi.

---

## 💡 Cara Kerja Singkat

1. **Pilih Lokasi**: Tentukan titik koordinat di dalam wilayah Kota Denpasar melalui peta interaktif atau fitur pencarian nama tempat/jalan.
2. **Pilih Tanggal**: Pilih tanggal yang diinginkan untuk melihat data kondisi lingkungan pada waktu tersebut.
3. **Analisis Risiko**: Sistem memproses parameter lingkungan setempat dan menampilkan tingkat risiko banjir (**Aman**, **Waspada**, atau **Rawan**) beserta estimasi probabilitasnya.

---

## 📚 5 Parameter Lingkungan yang Dianalisis

Sistem menganalisis 5 indikator utama yang mempengaruhi potensi terjadinya genangan dan banjir:

| Parameter | Penjelasan | Peran terhadap Banjir |
|---|---|---|
| 🌧️ **Curah Hujan** | Tingkat intensitas air hujan yang turun di suatu lokasi. | Hujan lebat berdurasi lama meningkatkan volume air yang harus ditampung saluran drainase. |
| ⛰️ **Elevasi (Ketinggian Tanah)** | Ketinggian posisi daratan dari permukaan air laut. | Dataran rendah dan cekungan menjadi muara limpasan air dari daerah yang lebih tinggi. |
| 🌿 **NDVI (Kerapatan Vegetasi)** | Indeks kehijauan yang menunjukkan kerapatan tanaman dan pohon. | Vegetasi yang rapat mempercepat penyerapan air ke dalam tanah (*infiltrasi*). |
| 🏙️ **Tutupan Lahan** | Karakteristik fisik permukaan tanah (lahan terbangun, sawah, perairan, dll). | Area terbangun dan semen kedap air menghambat resapan dan memperbesar limpasan permukaan. |
| 💧 **Kelembapan Tanah** | Tingkat kandungan air yang tersimpan di dalam pori-pori tanah. | Tanah yang sudah jenuh air memiliki daya serap rendah, sehingga air hujan langsung menggenang. |

---

## ✨ Fitur Utama

- 🗺️ **Peta Spasial Kota Denpasar**: Dibatasi sesuai batas administratif resmi untuk memastikan akurasi wilayah pemodelan.
- 🔍 **Pencarian Lokasi Cepat**: Memudahkan pencarian alamat, fasilitas umum, atau banjar/kelurahan di Denpasar.
- 📊 **Indikator Risiko Visual**: Visualisasi tingkat risiko yang intuitif dan informatif.
- 📖 **Modul Edukasi Interaktif**: Informasi edukatif tentang fungsi tiap parameter lingkungan bagi mitigasi bencana.
- 📱 **Desain Ramah Pengguna & Responsif**: Tampilan optimal di perangkat ponsel (*smartphone*), tablet, dan komputer.

---

## 🛠️ Teknologi yang Digunakan

- **Antarmuka (Frontend)**: React, Vite, Tailwind CSS, Leaflet Maps
- **Komputasi & Model (Backend)**: Python, Flask, Random Forest Classifier, Google Earth Engine
- **Data Spasial**: OpenStreetMap, GADM Boundary Data
