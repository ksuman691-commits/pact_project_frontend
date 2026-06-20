'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';

export default function DebugPage() {
  const { user, token, isInitialized } = useAuthStore();
  const [localToken, setLocalToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalToken(localStorage.getItem('access_token'));
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Debug Auth State</h1>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Auth Store State</h2>
              <div className="space-y-3 text-sm font-mono bg-slate-100 p-4 rounded">
                <p><span className="font-bold">isInitialized:</span> {String(isInitialized)}</p>
                <p><span className="font-bold">token:</span> {token ? '✓ Set' : '✗ Not set'}</p>
                <p><span className="font-bold">user:</span> {user ? `✓ ${user.full_name}` : '✗ Not set'}</p>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">localStorage Token</h2>
              <div className="space-y-3 text-sm font-mono bg-slate-100 p-4 rounded">
                <p><span className="font-bold">access_token:</span> {localToken ? '✓ Stored' : '✗ Not stored'}</p>
                {localToken && (
                  <p className="text-xs text-slate-600 break-all">
                    {localToken.substring(0, 50)}...
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Authorization Header</h2>
              <p className="text-sm text-slate-600 mb-4">
                Should be sent as: <code className="bg-slate-100 px-2 py-1">Authorization: Bearer {'{token}'}</code>
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm">
                {localToken ? (
                  <p className="text-blue-700">✓ Token will be sent in Authorization header</p>
                ) : (
                  <p className="text-red-700">✗ No token - requests will fail with 401</p>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Test</h2>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('http://localhost:8000/api/auth/me', {
                      headers: {
                        'Authorization': `Bearer ${localToken}`,
                      },
                    });
                    const data = await res.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (err) {
                    alert('Test failed: ' + String(err));
                  }
                }}
                className="btn-primary"
                disabled={!localToken}
              >
                Test /api/auth/me Endpoint
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
