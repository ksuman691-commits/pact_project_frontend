'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import { PageHeader, Spark, Tile, ago, rupees, shortDate } from '@/components/console/ui';
import { consoleApi, errorText, type Overview } from '@/lib/console/api';

const n = (v: number) => v.toLocaleString('en-IN');

function Section({ title, cols, children }: { title: string; cols: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="text-[13px] font-bold text-[var(--muted)]">{title}</h2>
      <div className={`mt-2.5 grid gap-3 ${cols}`}>{children}</div>
    </section>
  );
}

function Chart({ title, values, color }: { title: string; values: number[]; color?: string }) {
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-[16px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3.5">
      <div className="flex justify-between text-[13px]">
        <b>{title}</b>
        <span className="text-[var(--muted)]">{n(total)} in 30 days</span>
      </div>
      <div className="mt-2">
        <Spark values={values} color={color} label={`${title}, last 30 days`} />
      </div>
      <div className="flex justify-between text-[11.5px] text-[#8A8C93]">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function Board() {
  const member = useConsoleMember();
  const [data, setData] = useState<Overview | null>(null);
  const [loadedAt, setLoadedAt] = useState<number>(0);

  const load = useCallback(async () => {
    try {
      setData(await consoleApi.overview());
      setLoadedAt(Date.now());
    } catch (error) {
      toast.error(errorText(error, "Couldn't load the overview. Try again."));
    }
  }, []);

  useEffect(() => {
    if (member) void load();
  }, [member, load]);

  if (!member) return null;
  const today = data ? new Date(`${data.today}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const canStudio = member.role !== 'moderator';
  const canReports = member.role === 'owner' || member.role === 'moderator';

  return (
    <>
      <PageHeader
        title="Overview"
        sub={data ? `${today} · updated ${ago(new Date(loadedAt).toISOString())} · India time` : 'Loading…'}
        right={
          <button type="button" onClick={() => void load()} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold">
            Refresh
          </button>
        }
      />
      {!data ? (
        <div className="mt-5 h-[420px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : (
        <>
          <Section title="People" cols="grid-cols-2 lg:grid-cols-4">
            <Tile label="New sign-ups today" value={n(data.people.signups_today)} sub={`${n(data.people.signups_7d)} in the last 7 days`} />
            <Tile label="Checked in today" value={n(data.people.checked_in_today)} sub={`of ${n(data.people.with_live_pact)} with a live pact`} />
            <Tile label="Pacts started" value={n(data.people.pacts_started_7d)} sub="last 7 days" />
            <Tile label="Circles created" value={n(data.people.circles_created_7d)} sub="last 7 days" />
          </Section>
          <Section title="Dares" cols="grid-cols-2 lg:grid-cols-4">
            <Tile
              label="Dare of the day"
              value={data.dares.dare_of_the_day ? `${n(data.dares.dare_of_the_day.joined)} in` : 'None'}
              sub={data.dares.dare_of_the_day ? `${n(data.dares.dare_of_the_day.took)} took it · ${data.dares.dare_of_the_day.title}` : 'Nothing scheduled today'}
              href={canStudio ? '/console/studio' : undefined}
              warn={!data.dares.dare_of_the_day}
            />
            <Tile
              label="Dares sent"
              value={n(data.dares.sent_7d)}
              sub={`last 7 days${data.dares.accepted_share_7d != null ? ` · ${Math.round(data.dares.accepted_share_7d * 100)}% accepted` : ''}`}
            />
            <Tile label="Dares done" value={n(data.dares.done_7d)} sub="last 7 days" />
            <Tile label="Rewards marked paid" value={rupees(data.dares.rewards_marked_paid_7d)} sub="between people, last 7 days" />
          </Section>
          <Section title="Needs attention" cols="grid-cols-1 sm:grid-cols-3">
            <Tile
              label={data.attention.scam_reports ? `Open reports · ${data.attention.scam_reports} scam` : 'Open reports'}
              value={n(data.attention.open_reports)}
              sub={data.attention.oldest_report_at ? `oldest ${ago(data.attention.oldest_report_at)}` : 'none waiting'}
              href={canReports ? '/console/reports' : undefined}
              warn={data.attention.open_reports > 0}
            />
            <Tile
              label="Drafts to review"
              value={n(data.attention.drafts_to_review)}
              sub={data.attention.oldest_draft_at ? `oldest ${ago(data.attention.oldest_draft_at)}` : 'none waiting'}
              href={canStudio ? '/console/studio' : undefined}
            />
            <Tile
              label="Empty days ahead"
              value={n(data.attention.empty_days_ahead.length)}
              sub={data.attention.empty_days_ahead.length ? data.attention.empty_days_ahead.map((d) => shortDate(d)).join(', ') : 'next 7 days are set'}
              href={canStudio ? '/console/studio' : undefined}
              warn={data.attention.empty_days_ahead.length > 0}
            />
          </Section>
          <Section title="Last 30 days" cols="grid-cols-1 lg:grid-cols-3">
            <Chart title="Sign-ups" values={data.series.signups} />
            <Chart title="Check-ins" values={data.series.check_ins} />
            <Chart title="Dares sent" values={data.series.dares_sent} color="#B8860B" />
          </Section>
          <p className="mt-3.5 text-[12.5px] text-[var(--muted)]">From our own database. Site errors and speed aren&apos;t tracked yet (that needs a tool such as Sentry).</p>
        </>
      )}
    </>
  );
}

export default function OverviewPage() {
  return (
    <ConsoleFrame>
      <Board />
    </ConsoleFrame>
  );
}
