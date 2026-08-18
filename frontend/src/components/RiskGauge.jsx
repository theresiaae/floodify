const SIZE = 132
const STROKE = 11
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const LEVELS = {
  rawan: { color: '#c1543a', label: 'Rawan Banjir' },
  waspada: { color: '#d99a3c', label: 'Waspada' },
  aman: { color: '#4d8f6f', label: 'Aman' },
}

export function levelFromStatus(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('rawan') || s.includes('tinggi')) return 'rawan'
  if (s.includes('waspada') || s.includes('sedang')) return 'waspada'
  return 'aman'
}

export default function RiskGauge({ probability = 0, level = 'aman' }) {
  const clamped = Math.max(0, Math.min(100, probability))
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE
  const { color } = LEVELS[level] || LEVELS.aman

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#e3ebe0"
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
        <span className="font-mono text-3xl font-semibold text-deep-900">
          {clamped.toFixed(0)}%
        </span>
        <span className="text-xs uppercase tracking-wide text-deep-700/80 font-semibold mt-0.5">
          probabilitas
        </span>
      </div>
    </div>
  )
}
