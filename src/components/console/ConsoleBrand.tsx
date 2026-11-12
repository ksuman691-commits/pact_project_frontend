import LogoMark from '@/components/LogoMark';

/** The CirclePact wordmark with a "Console" tag, so nobody mistakes this for the app. */
export default function ConsoleBrand({ size = 24, tone = 'ink' }: { size?: number; tone?: 'ink' | 'cream' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} tone={tone} />
      <span
        className="rounded-full px-2 py-[3px] text-[11.5px] font-bold leading-none"
        style={tone === 'cream' ? { background: '#FBF8F1', color: 'var(--ink)' } : { background: 'var(--ink)', color: '#fff' }}
      >
        Console
      </span>
    </span>
  );
}
