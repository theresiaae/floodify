import { NavLink } from 'react-router-dom'

const linkBase =
  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-[1100] border-b border-deep-200/70 bg-sand/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span className="font-display text-xl font-semibold tracking-tight text-deep-900">
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
            Edukasi Parameter
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
