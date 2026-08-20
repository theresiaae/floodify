export default function ParameterCard({ icon: Icon, title, description, source, index }) {
  return (
    <div className="rise-in group relative overflow-hidden rounded-2xl border border-deep-200 bg-white/80 p-5 sm:p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-deep-900/5 flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-200 text-deep-800">
            <Icon size={24} strokeWidth={1.75} />
          </div>
          <span className="font-mono text-sm text-deep-700/70 font-semibold">
            {String(index).padStart(2, '0')}
          </span>
        </div>
        <h3 className="font-display text-xl font-semibold text-deep-900">{title}</h3>
        <p className="mt-2 text-base leading-relaxed text-deep-800/80">{description}</p>
      </div>
      <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-deep-100 px-3 py-1 text-xs font-medium text-deep-700 w-fit">
        <span className="h-1.5 w-1.5 rounded-full bg-deep-500" />
        {source}
      </div>
    </div>
  )
}
