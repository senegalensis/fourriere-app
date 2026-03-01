import { createWorker } from 'tesseract.js'

const PLATE_REGEX = /[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}/i
const MIN_CONFIDENCE = 60

let worker: Awaited<ReturnType<typeof createWorker>> | null = null

async function getWorker() {
  if (!worker) {
    worker = await createWorker('fra', 1, {
      cacheMethod: 'write',
    })
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      tessedit_pageseg_mode: 7 as any, // single line
    })
  }
  return worker
}

export async function recognizePlate(canvas: HTMLCanvasElement): Promise<string | null> {
  const w = await getWorker()
  const { data } = await w.recognize(canvas)

  if (data.confidence < MIN_CONFIDENCE) {
    return null
  }

  const text = data.text.trim().toUpperCase()
  const match = text.match(PLATE_REGEX)

  if (match) {
    return match[0].replace(/\s+/g, '-')
  }

  return null
}

export async function terminateOCR() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
