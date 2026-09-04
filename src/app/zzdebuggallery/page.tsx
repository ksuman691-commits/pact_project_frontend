'use client';

import FeedPactCard from '@/components/FeedPactCard';

// TEMPORARY debug harness — reproduces the reported feed-gallery bug report
// (photos 2 and 3 not loading) using the exact same recent_proofs shape the
// backend actually returns ({ url, username, created_at } only — confirmed
// by reading app/api/pacts.py::_recent_proofs_for_pacts in the backend
// repo). Delete this route once the investigation is done.
const mockPact = {
  id: 999,
  creator: 'debuguser',
  creator_username: 'debuguser',
  title: 'Debug gallery pact',
  category: 'Coding',
  start_date: '2026-08-01',
  end_date: '2026-10-30',
  is_joined_by_me: true,
  proof_count: 3,
  active_cheer_count: 0,
  comment_count: 0,
  can_join: false,
  join_block_reason: 'already_joined',
  // Real signed S3 URLs pulled live from GET /api/pacts (pact id 79, a
  // throwaway test pact created specifically for this investigation) —
  // confirmed individually loadable via direct curl (all 3 returned
  // HTTP 200) moments before being pasted in here.
  recent_proofs: [
    { url: 'https://pact-proofs-suman-2026.s3.amazonaws.com/pact-proofs/pact_79/user_100/20260904035355.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQQCRHA2KVFRWQYG2%2F20260904%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260904T035406Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=18d1a5ce1703334becc7c9870635fd5f82b97b0444608f8461031b656e6d84de', username: 'v0debug', created_at: '2026-09-04T03:53:56Z' },
    { url: 'https://pact-proofs-suman-2026.s3.amazonaws.com/pact-proofs/pact_79/user_100/20260904035353.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQQCRHA2KVFRWQYG2%2F20260904%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260904T035406Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=d6e51148c02bff361cf223eb424a5b171dd969c461a9801f51044d2aade98290', username: 'v0debug', created_at: '2026-09-04T03:53:54Z' },
    { url: 'https://pact-proofs-suman-2026.s3.amazonaws.com/pact-proofs/pact_79/user_100/20260904035352.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQQCRHA2KVFRWQYG2%2F20260904%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260904T035406Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=1f6a40ad3af82e84307017ddfd8e22093494a794eaa1eb72f005e3d30ffa7dfd', username: 'v0debug', created_at: '2026-09-04T03:53:52Z' },
  ],
};

export default function DebugGalleryPage() {
  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <FeedPactCard pact={mockPact} />
    </div>
  );
}
