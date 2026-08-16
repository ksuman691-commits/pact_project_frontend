'use client';

export default function QAErrorTest() {
  throw new Error('QA test: intentional render-time crash to verify error.tsx boundary');
}
