import { ogImage, OG_SIZE } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A pact on CirclePact'

export default function Image() {
  return ogImage('I made a pact', 'Keep me honest. Watch me show up every day.')
}
