import { CloudRain, Mountain, Leaf, TreeDeciduous, Waves } from 'lucide-react'
import ParameterCard from '../components/ParameterCard'

const PARAMETERS = [
  {
    icon: CloudRain,
    title: 'Curah Hujan',
    description:
      'Jumlah air hujan yang turun di suatu titik dalam periode tertentu. Curah hujan yang tinggi dan terus-menerus mempercepat genangan air, terutama saat kapasitas drainase kota terlampaui.',
    source: 'CHIRPS — Model • Visual Crossing — Prediksi',
  },
  {
    icon: Mountain,
    title: 'Elevasi',
    description:
      'Ketinggian permukaan tanah dari permukaan laut. Wilayah dengan elevasi rendah cenderung menjadi tempat berkumpulnya limpasan air dari daerah yang lebih tinggi sehingga lebih rawan tergenang.',
    source: 'SRTM 30m — Google Earth Engine',
  },
  {
    icon: Leaf,
    title: 'NDVI',
    description:
      'Normalized Difference Vegetation Index, indeks yang menggambarkan kerapatan vegetasi di suatu area. Vegetasi yang rapat membantu menyerap air hujan, sedangkan area minim vegetasi lebih rentan terhadap limpasan permukaan.',
    source: 'Landsat 8 — Google Earth Engine',
  },
  {
    icon: TreeDeciduous,
    title: 'Tutupan Lahan',
    description:
      'Jenis permukaan yang menutupi suatu area, seperti lahan terbangun, vegetasi, atau badan air. Lahan terbangun yang didominasi permukaan kedap air memperbesar volume limpasan saat hujan.',
    source: 'ESA WorldCover — Google Earth Engine',
  },
  {
    icon: Waves,
    title: 'Kelembapan Tanah',
    description:
      'Kadar air yang tersimpan di lapisan tanah. Tanah yang sudah jenuh air memiliki daya serap yang rendah, sehingga air hujan tambahan lebih besar kemungkinannya menjadi genangan atau limpasan.',
    source: 'ERA5-Land — Google Earth Engine',
  },
]

export default function Edukasi() {
  return (
    <div className="mx-auto max-w-[1580px] w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm sm:text-base font-bold uppercase tracking-wider text-deep-800">
          Tentang Parameter
        </p>
        <h1 className="font-display text-3xl font-bold text-deep-950 sm:text-4xl lg:text-5xl tracking-tight">
          Parameter yang Digunakan dalam Prediksi
        </h1>
        <p className="mt-3.5 sm:mt-4 text-base sm:text-lg leading-relaxed text-deep-900/90 font-medium">
          Berikut adalah lima parameter yang digunakan model machine learning untuk
          memprediksi risiko banjir di Kota Denpasar.
        </p>
      </div>

      <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PARAMETERS.map((param, i) => (
          <ParameterCard key={param.title} index={i + 1} {...param} />
        ))}
      </div>
    </div>
  )
}
