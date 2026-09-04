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
  // Real signed S3 URLs re-pulled live from GET /api/pacts (pact id 79, the
  // same throwaway test pact) moments before this render — each one
  // individually curl'd and confirmed HTTP 200 with real JPEG bytes
  // immediately beforehand (the previous batch pasted here had since
  // expired, which is itself expected: these are short-lived signed URLs,
  // not evidence of a bug on their own).
  recent_proofs: [
    { url: 'https://pact-proofs-suman-2026.s3.amazonaws.com/pact-proofs/pact_79/user_100/20260904035355.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQQCRHA2KVFRWQYG2%2F20260904%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260904T050957Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=1bbe0f570c02694dcc28a24a071df1154f89bb9dba15b0d5eea11a97e93260fa', username: 'v0debug', created_at: '2026-09-04T03:53:56Z' },
    { url: 'https://pact-proofs-suman-2026.s3.amazonaws.com/pact-proofs/pact_79/user_100/20260904035353.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQQCRHA2KVFRWQYG2%2F20260904%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260904T050957Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=fdfcb569f27da13ac60ae12964623585feba1170e024305dea742141213715d3', username: 'v0debug', created_at: '2026-09-04T03:53:54Z' },
    { url: 'https://pact-proofs-suman-2026.s3.amazonaws.com/pact-proofs/pact_79/user_100/20260904035352.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQQCRHA2KVFRWQYG2%2F20260904%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260904T050957Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=e74eb1c9722d68d4a6de33f08ecb272b2f7f89fdbec120e32cbc3d56e0ee0068', username: 'v0debug', created_at: '2026-09-04T03:53:52Z' },
  ],
};

export default function DebugGalleryPage() {
  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <FeedPactCard pact={mockPact} />
    </div>
  );
}
