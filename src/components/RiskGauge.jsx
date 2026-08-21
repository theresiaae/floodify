const SIZE = 144
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const LEVELS = {
  banjir: { color: '#b91c1c', label: 'Banjir' },
  tidak_banjir: { color: '#15803d', label: 'Tidak Banjir' },
}

export function levelFromStatus(status) {
  const s = (status || '').toLowerCase()
  // "tidak banjir" mengandung kata "banjir" juga, jadi dicek duluan.
  if (s.includes('tidak')) return 'tidak_banjir'
  if (s.includes('banjir')) return 'banjir'
  return 'tidak_banjir'
}

export default function RiskGauge({ probability = 0, level = 'tidak_banjir' }) {
  const clamped = Math.max(0, Math.min(100, probability))
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE
  const { color } = LEVELS[level] || LEVELS.tidak_banjir

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#cbdcd8"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.3,1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl sm:text-4xl font-bold text-deep-950">
          {clamped.toFixed(1)}%
        </span>
        <span className="text-xs sm:text-sm uppercase tracking-wider text-deep-900 font-bold mt-0.5">
          probabilitas
        </span>
      </div>
    </div>
  )
}