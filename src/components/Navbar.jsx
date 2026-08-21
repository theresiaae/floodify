import { NavLink } from 'react-router-dom'

const linkBase =
  'px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition-colors duration-200 whitespace-nowrap'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-[1100] border-b border-deep-300/80 bg-sand/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1580px] w-full items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[32px] sm:h-[32px]">
            <path
              d="M15 2C15 2 6 13.5 6 19.5C6 24.7467 10.0294 28 15 28C19.9706 28 24 24.7467 24 19.5C24 13.5 15 2 15 2Z"
              className="fill-deep-800"
            />
            <path
              d="M9.5 20.5C9.5 23.5 11.8 26 15 26"
              stroke="#cddaca"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-deep-950">
            Floodify
          </span>
        </div>
        <nav className="flex items-center gap-1.5 rounded-full border border-deep-300 bg-white/90 p-1 shadow-2xs">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-deep-900 text-sand shadow-sm' : 'text-deep-950 hover:bg-sage-200'}`
            }
          >
            Prediksi
          </NavLink>
          <NavLink
            to="/edukasi"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-deep-900 text-sand shadow-sm' : 'text-deep-950 hover:bg-sage-200'}`
            }
          >
            <span>Tentang<span className="hidden sm:inline"> Parameter</span></span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
