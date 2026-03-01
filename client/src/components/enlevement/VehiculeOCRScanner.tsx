import { useRef, useState, useEffect } from 'react'
import { recognizePlate } from '@/services/ocr.service'
import Spinner from '@/components/ui/Spinner'

interface Props {
  onResult: (matricule: string) => void
  onClose: () => void
}

export default function VehiculeOCRScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setError("Impossible d'acceder a la camera")
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  const capture = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setProcessing(true)
    setError('')

    const ctx = canvas.getContext('2d')!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Pre-processing: grayscale + contrast
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
      const contrast = ((gray - 128) * 1.5) + 128
      const val = Math.max(0, Math.min(255, contrast))
      d[i] = d[i + 1] = d[i + 2] = val
    }
    ctx.putImageData(imageData, 0, 0)

    try {
      const result = await recognizePlate(canvas)
      if (result) {
        stopCamera()
        onResult(result)
      } else {
        setError('Plaque non reconnue. Reessayez.')
      }
    } catch {
      setError('Erreur OCR')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <h3 className="font-semibold">Scanner la plaque</h3>
        <button onClick={() => { stopCamera(); onClose() }} className="text-xl">&times;</button>
      </div>

      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-white/60 rounded-lg w-3/4 h-16" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-red-400 text-center text-sm py-2">{error}</p>}

      <div className="p-4">
        <button
          onClick={capture}
          disabled={processing}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {processing ? <><Spinner size="sm" /> Analyse...</> : 'Capturer'}
        </button>
      </div>
    </div>
  )
}
