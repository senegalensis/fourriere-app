export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className={`${sizeClass} animate-spin rounded-full border-2 border-gray-300 border-t-primary-600`} />
  )
}
