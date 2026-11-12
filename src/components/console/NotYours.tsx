/** Shown when someone opens a console page their role doesn't cover. The server refuses the data too. */
export default function NotYours() {
  return (
    <div className="rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] p-6">
      <h1 className="text-[22px] font-bold tracking-[-0.03em]">This isn&apos;t part of your role</h1>
      <p className="mt-1.5 text-[14.5px] text-[var(--muted)]">Ask the owner if you need access.</p>
    </div>
  );
}
