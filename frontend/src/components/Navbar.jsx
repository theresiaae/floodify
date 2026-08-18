import { NavLink } from 'react-router-dom'

const linkBase =
  'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-[1100] border-b border-deep-200/70 bg-sand/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1580px] w-full items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[30px] sm:h-[30px]">
            <path
              d="M15 2C15 2 6 13.5 6 19.5C6 24.7467 10.0294 28 15 28C19.9706 28 24 24.7467 24 19.5C24 13.5 15 2 15 2Z"
              className="fill-deep-700"
            />
            <path
              d="M9.5 20.5C9.5 23.5 11.8 26 15 26"
              stroke="#cddaca"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-lg sm:text-xl font-semibold tracking-tight text-deep-900">
            Floodify
          </span>
        </div>
        <nav className="flex items-center gap-1 rounded-full border border-deep-200 bg-white/70 p-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-deep-800 text-sand shadow-sm' : 'text-deep-800 hover:bg-sage-200'}`
            }
          >
            Prediksi
          </NavLink>
          <NavLink
            to="/edukasi"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-deep-800 text-sand shadow-sm' : 'text-deep-800 hover:bg-sage-200'}`
            }
          >
            <span>Tentang<span className="hidden sm:inline"> Parameter</span></span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
