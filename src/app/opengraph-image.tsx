import { ogImage, OG_SIZE } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'CirclePact: say it, show it, your circle keeps you honest'

export default function Image() {
  return ogImage('Accountability, together', 'Say it. Show it. Your circle keeps you honest.')
}
