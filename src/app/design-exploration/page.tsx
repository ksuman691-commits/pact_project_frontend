import PactCardConcept from '@/components/design-exploration/PactCardConcept';
import CircleOrbitConcept from '@/components/design-exploration/CircleOrbitConcept';

// Standalone visual exploration — isolated from the real app's routing/data.
// Not linked from any nav. View directly at /design-exploration.
const now = new Date('2026-10-04T12:00:00Z');

export default function DesignExplorationPage() {
  return (
    <div className="min-h-screen px-5 py-10" style={{ background: 'var(--pact-bg)' }}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pact-text-faint)' }}>
            Design exploration — not wired into the app
          </p>
          <h1 className="mt-1 text-3xl font-bold" style={{ color: 'var(--pact-text)' }}>
            Pact Card &amp; Circle Identity concepts
          </h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--pact-text-dim)' }}>
            Every state below reflects honest, real data — a quiet circle looks calm not broken, and a 0%
            track record is shown plainly rather than hidden.
          </p>
        </header>

        {/* ---------------- Pact Card concept ---------------- */}
        <section className="mb-14">
          <h2 className="mb-1 text-xl font-bold" style={{ color: 'var(--pact-text)' }}>
            1. Pact Card
          </h2>
          <p className="mb-5 text-sm" style={{ color: 'var(--pact-text-dim)' }}>
            Three honest states: a 1:1 pact with a real mixed track record under real time pressure, a
            group pact with a strong record and plenty of runway, and a brand new pact type with zero
            history.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PactCardConcept
              title="Gym 5x this week"
              category="Fitness"
              mode="1:1"
              accountablePerson={{ name: 'Sam' }}
              deadline={new Date('2026-10-04T18:00:00Z')}
              now={now}
              trackRecord={['done', 'done', 'missed', 'done', 'missed', 'done']}
              proofStatus="none"
            />
            <PactCardConcept
              title="Ship the Q4 report"
              category="Work"
              mode="group"
              circleName="The Rich List"
              circleMembers={[{ name: 'Priya' }, { name: 'Jon' }, { name: 'Ada' }]}
              circleMemberCount={6}
              deadline={new Date('2026-10-09T12:00:00Z')}
              now={now}
              trackRecord={['done', 'done', 'done', 'done']}
              proofStatus="verified"
              proofSubmittedAgo="3h ago"
            />
            <PactCardConcept
              title="No sugar for 30 days"
              category="Health"
              mode="1:1"
              accountablePerson={{ name: 'Maya' }}
              deadline={new Date('2026-11-03T12:00:00Z')}
              now={now}
              trackRecord={[]}
              proofStatus="none"
            />
          </div>
        </section>

        {/* ---------------- Circle Orbit concept ---------------- */}
        <section>
          <h2 className="mb-1 text-xl font-bold" style={{ color: 'var(--pact-text)' }}>
            2. Circle identity — orbit
          </h2>
          <p className="mb-5 text-sm" style={{ color: 'var(--pact-text-dim)' }}>
            Three honest states: a brand new circle with no activity yet, a circle where a minority are
            active this week, and a circle that&apos;s genuinely buzzing.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-3xl p-6" style={{ background: 'var(--pact-surface)' }}>
              <CircleOrbitConcept
                name="The Rich List"
                members={[{ name: 'You', activeThisWeek: false }]}
              />
              <p className="text-center text-xs" style={{ color: 'var(--pact-text-faint)' }}>
                New circle, 1 member, 0 activity
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-3xl p-6" style={{ background: 'var(--pact-surface)' }}>
              <CircleOrbitConcept
                name="Morning Runners"
                members={[
                  { name: 'You', activeThisWeek: true },
                  { name: 'Priya', activeThisWeek: false },
                  { name: 'Jon', activeThisWeek: false },
                  { name: 'Ada', activeThisWeek: false },
                  { name: 'Leo', activeThisWeek: false },
                  { name: 'Mei', activeThisWeek: false },
                ]}
              />
              <p className="text-center text-xs" style={{ color: 'var(--pact-text-faint)' }}>
                6 members, 1 active this week
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-3xl p-6" style={{ background: 'var(--pact-surface)' }}>
              <CircleOrbitConcept
                name="No Excuses Crew"
                members={[
                  { name: 'You', activeThisWeek: true },
                  { name: 'Priya', activeThisWeek: true },
                  { name: 'Jon', activeThisWeek: true },
                  { name: 'Ada', activeThisWeek: false },
                  { name: 'Leo', activeThisWeek: true },
                ]}
              />
              <p className="text-center text-xs" style={{ color: 'var(--pact-text-faint)' }}>
                5 members, 4 active this week
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
