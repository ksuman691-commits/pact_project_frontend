type ActivePactFireBadgeProps = {
  size?: number
  className?: string
  variant?: 'standalone' | 'fused'
  cutoutColor?: string
}

// Intentionally renders nothing. The classic redesign removes streak flames
// and glowing "hot" badges: they implied energy the data does not prove.
// Callers are kept as-is so the badge can be reintroduced as a plain,
// factual marker later without touching every call site.
export default function ActivePactFireBadge(_props: ActivePactFireBadgeProps) {
  return null
}
