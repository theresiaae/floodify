export default function ParameterCard({ icon: Icon, title, description, source, index }) {
  return (
    <div className="rise-in group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-deep-300/80 bg-white/95 p-6 sm:p-7 transition-all duration-300 hover:shadow-lg hover:shadow-deep-900/5 flex flex-col justify-between">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-200 text-deep-950 shadow-2xs">
            <Icon size={28} strokeWidth={2} />
          </div>
          <span className="font-mono text-base sm:text-lg text-deep-900 font-bold">
            {String(index).padStart(2, '0')}
          </span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-deep-950">{title}</h3>
        <p className="mt-3 text-base sm:text-lg leading-relaxed text-deep-900/90 font-normal">{description}</p>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-deep-100/90 border border-deep-300/80 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-deep-950 w-fit">
        <span className="h-2 w-2 rounded-full bg-deep-600" />
        {source}
      </div>
    </div>
  )
}
