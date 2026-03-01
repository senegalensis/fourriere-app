interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  onClear?: () => void
  placeholder?: string
  className?: string
  uppercase?: boolean
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Rechercher…',
  className = '',
  uppercase = false,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white ${uppercase ? 'font-mono tracking-wider' : ''}`}
        />
      </div>
      {onSubmit && (
        <button
          type="submit"
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          Rechercher
        </button>
      )}
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Effacer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}
