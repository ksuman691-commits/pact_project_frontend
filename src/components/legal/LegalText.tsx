import React from 'react';

// Renders the small markdown subset used by src/content/*.ts:
// "## " headings, "- " bullets, **bold**, [links](/path), blank-line separated paragraphs.
// Links are written [text](/path); placeholders like [Name] have no (path).
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]*\))/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/);
    if (link) {
      return <a key={i} href={link[2]} className="font-semibold text-[var(--navy)] underline">{link[1]}</a>;
    }
    return part;
  });
}

export default function LegalText({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const out: React.ReactNode[] = [];
        let bullets: string[] = [];
        const flush = () => {
          if (!bullets.length) return;
          out.push(
            <ul key={`u${out.length}`} className="list-disc space-y-1.5 pl-5">
              {bullets.map((b, j) => <li key={j}>{inline(b)}</li>)}
            </ul>,
          );
          bullets = [];
        };
        for (const line of lines) {
          if (line.startsWith('## ')) {
            flush();
            out.push(<h2 key={`h${out.length}`} className="pt-4 text-[17px] font-extrabold text-ink">{line.slice(3)}</h2>);
          } else if (line.startsWith('- ')) {
            bullets.push(line.slice(2));
          } else {
            flush();
            out.push(<p key={`p${out.length}`}>{inline(line)}</p>);
          }
        }
        flush();
        return <React.Fragment key={i}>{out}</React.Fragment>;
      })}
    </div>
  );
}
