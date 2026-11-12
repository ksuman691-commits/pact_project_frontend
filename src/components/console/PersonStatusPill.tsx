import { Pill, RED } from '@/components/console/ui';
import type { PersonStatus } from '@/lib/console/api';

function daysLeft(iso: string): number {
  const end = new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime();
  return Math.max(1, Math.ceil((end - Date.now()) / 86_400_000));
}

export default function PersonStatusPill({ status }: { status: PersonStatus }) {
  if (status.state === 'suspended') {
    const left = status.until ? `${daysLeft(status.until)} ${daysLeft(status.until) === 1 ? 'day' : 'days'} left` : 'until lifted';
    return (
      <Pill bg="#FBEAE8" fg={RED}>
        Suspended · {left}
      </Pill>
    );
  }
  if (status.state === 'deleting')
    return (
      <Pill bg="#E6E1D6" fg="#5A5C63">
        Deleting
      </Pill>
    );
  if (status.state === 'deleted')
    return (
      <Pill bg="#E6E1D6" fg="#5A5C63">
        Deleted
      </Pill>
    );
  return <Pill bg="#2E8B57">Active</Pill>;
}
