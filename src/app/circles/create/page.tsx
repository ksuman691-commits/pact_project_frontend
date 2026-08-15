'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import CreateCircleFlow from '@/components/create-circle-flow/CreateCircleFlow';

export default function CreateCirclePage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();

  if (!isInitialized) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--pact-pink)]" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return <CreateCircleFlow onExit={() => router.back()} />;
}
