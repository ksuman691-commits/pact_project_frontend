import { ogImage, OG_SIZE } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'You are invited to a circle on CirclePact'

export default function Image() {
  return ogImage("You're invited", 'Join my circle. We show up for each other, one photo a day.')
}
