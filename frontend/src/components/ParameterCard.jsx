export default function ParameterCard({ icon: Icon, title, description, source, index }) {
  return (
    <div className="rise-in group relative overflow-hidden rounded-2xl border border-deep-200 bg-white/80 p-5 transition-shadow duration-300 hover:shadow-lg hover:shadow-deep-900/5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-200 text-deep-800">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <span className="font-mono text-xs text-deep-700/50">
          {String(index).padStart(2, '0')}
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-deep-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-deep-800/80">{description}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-deep-100 px-2.5 py-1 text-[11px] font-medium text-deep-700">
        <span className="h-1.5 w-1.5 rounded-full bg-deep-500" />
        {source}
      </div>
    </div>
  )
}
