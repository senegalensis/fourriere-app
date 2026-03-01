interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
  sub?: string
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-primary-50',
  iconColor = 'text-primary-600',
  sub,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
