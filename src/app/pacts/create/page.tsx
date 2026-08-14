'use client';

import { useRouter } from 'next/navigation';
import CreatePactFlow from '@/components/create-pact-flow/CreatePactFlow';

export default function CreatePactPage() {
  const router = useRouter();

  return <CreatePactFlow onExit={() => router.back()} />;
}
