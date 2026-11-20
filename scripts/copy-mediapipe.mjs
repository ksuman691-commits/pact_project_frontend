// Puts MediaPipe's face-tracking engine and model in public/mediapipe so the
// camera loads them from our own domain: phones never fetch them from a CDN or
// from Google. Runs before `next dev` and `next build`.
//  - engine (WebAssembly): copied from node_modules, so it matches the library
//  - face model (3.7 MB): downloaded once from Google's published URL at build
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'

const engineFrom = 'node_modules/@mediapipe/tasks-vision/wasm'
const out = 'public/mediapipe'
const model = `${out}/face_landmarker.task`
const MODEL_SOURCE = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

if (!existsSync(engineFrom)) {
  console.warn('[mediapipe] @mediapipe/tasks-vision not installed; face effects will be unavailable')
  process.exit(0)
}
mkdirSync(`${out}/wasm`, { recursive: true })
cpSync(engineFrom, `${out}/wasm`, { recursive: true })
console.log('[mediapipe] engine copied')

if (existsSync(model)) {
  console.log('[mediapipe] face model already present')
} else {
  try {
    const res = await fetch(MODEL_SOURCE, { signal: AbortSignal.timeout(60_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const bytes = Buffer.from(await res.arrayBuffer())
    // A .task file is a zip: check the signature so an error page is never saved as the model.
    if (bytes.length < 1_000_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('unexpected file')
    writeFileSync(model, bytes)
    console.log(`[mediapipe] face model downloaded (${(bytes.length / 1e6).toFixed(1)} MB)`)
  } catch (err) {
    // Don't fail the build: looks still work, effects show "couldn't load".
    console.warn('[mediapipe] could not download the face model; face effects will be unavailable:', err?.message || err)
  }
}
