import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Prediksi from './pages/Prediksi'
import Edukasi from './pages/Edukasi'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Prediksi />} />
        <Route path="/edukasi" element={<Edukasi />} />
      </Routes>
    </div>
  )
}
