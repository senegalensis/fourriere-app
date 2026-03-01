import { useRef } from 'react'

interface Props {
  photos: { type: string; data: string }[]
  onChange: (photos: { type: string; data: string }[]) => void
}

const PHOTO_TYPES = ['avant', 'arriere', 'gauche', 'droite', 'interieur', 'autre']
const MAX_PHOTOS = 6

export default function StepPhotos({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const capturePhoto = (type: string) => {
    const input = inputRef.current
    if (!input) return
    input.setAttribute('data-type', type)
    input.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const type = e.target.getAttribute('data-type') || 'autre'

    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      onChange([...photos, { type, data }])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Photos</h3>
      <p className="text-sm text-gray-500">Prenez jusqu'a {MAX_PHOTOS} photos du vehicule</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2">
        {PHOTO_TYPES.map((type) => {
          const photo = photos.find((p) => p.type === type)
          return (
            <div key={type} className="relative">
              {photo ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={photo.data} alt={type} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(photos.indexOf(photo))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => capturePhoto(type)}
                  disabled={photos.length >= MAX_PHOTOS}
                  className="aspect-square w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">+</span>
                </button>
              )}
              <p className="text-[10px] text-center text-gray-500 mt-1 capitalize">{type}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
