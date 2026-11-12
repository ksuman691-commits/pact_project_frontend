'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConsoleFrame from '@/components/console/ConsoleFrame';
import { PageHeader, Tile, rupees } from '@/components/console/ui';
import { consoleApi, errorText, type Money } from '@/lib/console/api';

const RANGES = [7, 30, 90, 365];
const count = (c: number, one: string, many: string) => `${c.toLocaleString('en-IN')} ${c === 1 ? one : many}`;

function Books() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Money | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await consoleApi.money(days));
    } catch (error) {
      toast.error(errorText(error, "Couldn't load the numbers. Try again."));
    }
  }, [days]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Money" sub="What moved between people, and CirclePact's own books." />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {RANGES.map((d) => (
          <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={`h-[34px] rounded-full px-3.5 text-[13.5px] font-bold ${days === d ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}>
            {d === 365 ? 'Last year' : `Last ${d} days`}
          </button>
        ))}
      </div>
      {!data ? (
        <div className="mt-4 h-[360px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : (
        <>
          <section className="mt-5">
            <h2 className="text-[13px] font-bold text-[var(--muted)]">CirclePact&apos;s books</h2>
            <div className="mt-2.5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Revenue" value={rupees(data.circlepact.revenue)} />
              <Tile label="Commission" value={rupees(data.circlepact.commission)} sub={data.circlepact.commission_rate ? `${data.circlepact.commission_rate}% of payments` : 'We take no cut today'} />
              <Tile label="GST on commission" value={rupees(data.circlepact.gst_on_commission)} sub="18% of commission, once there is one" />
              <Tile label="TCS / TDS held" value={rupees(data.circlepact.tcs_collected + data.circlepact.tds_deducted)} sub="only if money passes through us" />
            </div>
            <p className="mt-2.5 max-w-[760px] text-[13px] leading-[1.5] text-[var(--muted)]">
              Today money goes straight from one person&apos;s UPI app to the other&apos;s. CirclePact holds none of it and takes no cut, so there&apos;s no GST, TCS or TDS on these payments from us.
              If we add a commission through a payment gateway, these fill in from it. Check rates and filing with a chartered accountant.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-[13px] font-bold text-[var(--muted)]">Between people (never through CirclePact)</h2>
            <div className="mt-2.5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Dare rewards marked paid" value={rupees(data.between_people.dare_rewards_marked_paid.amount)} sub={count(data.between_people.dare_rewards_marked_paid.count, 'reward', 'rewards')} />
              <Tile label="Confirmed by the doer" value={rupees(data.between_people.dare_rewards_confirmed.amount)} sub={count(data.between_people.dare_rewards_confirmed.count, 'reward', 'rewards')} />
              <Tile label="Paid pacts" value={rupees(data.between_people.paid_pacts.amount)} sub={count(data.between_people.paid_pacts.count, 'purchase', 'purchases')} />
              <Tile label="Tips" value={rupees(data.between_people.tips.amount)} sub={count(data.between_people.tips.count, 'tip', 'tips')} />
            </div>
            <p className="mt-2.5 text-[12.5px] text-[var(--muted)]">These are what people told us they paid. We can&apos;t see bank or UPI records.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-[13px] font-bold text-[var(--muted)]">Disputes</h2>
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Tile
                label="Rewards “not received”"
                value={count(data.disputes.rewards_not_received.count, 'reward', 'rewards')}
                sub={rupees(data.disputes.rewards_not_received.amount)}
                warn={data.disputes.rewards_not_received.count > 0}
              />
              <Tile
                label="Tips “never arrived”"
                value={count(data.disputes.tips_not_received.count, 'tip', 'tips')}
                sub={rupees(data.disputes.tips_not_received.amount)}
                warn={data.disputes.tips_not_received.count > 0}
              />
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default function MoneyPage() {
  return (
    <ConsoleFrame ownerOnly>
      <Books />
    </ConsoleFrame>
  );
}
