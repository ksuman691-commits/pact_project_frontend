import CuratedReviewQueue from '@/components/CuratedReviewQueue';

export const metadata = {
  title: 'Curated Review Queue | CirclePact',
  robots: { index: false, follow: false },
};

export default function CuratedReviewPage() {
  return <CuratedReviewQueue />;
}
