'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { joinRequestService, pactService, verificationService } from '@/services/api';
import { Pact, Verification } from '@/types';
import toast from 'react-hot-toast';

export default function PactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [pact, setPact] = useState<Pact | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationAnswers, setVerificationAnswers] = useState({
    q1: 'yes',
    q2: 'authentic',
    q3: 'fully_followed',
    q4: 'yes_confident',
  });

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchPact = async () => {
      try {
        const [pactRes, verificationRes] = await Promise.all([
          pactService.getById(Number(params.id)),
          verificationService.getByPactId(Number(params.id)),
        ]);
        setPact(pactRes.data);
        setVerifications(verificationRes.data);
      } catch (error: any) {
        toast.error('Failed to load pact');
      } finally {
        setLoading(false);
      }
    };

    fetchPact();
  }, [user, router, params.id]);

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error('Please select a proof file or photo');
      return;
    }

    try {
      await pactService.uploadProofFile(Number(params.id), proofFile);
      toast.success('Proof uploaded successfully!');
      setProofFile(null);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload proof');
    }
  };

  const handleRequestJoinPact = async () => {
    try {
      await joinRequestService.sendRequest(Number(params.id));
      toast.success('Join request sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to request to join pact');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verificationService.create(Number(params.id), {
        pact_id: Number(params.id),
        answers: [
          { question: 'q1', answer: verificationAnswers.q1, reason: '' },
          { question: 'q2', answer: verificationAnswers.q2, reason: '' },
          { question: 'q3', answer: verificationAnswers.q3, reason: '' },
          { question: 'q4', answer: verificationAnswers.q4, reason: '' },
        ],
      });
      toast.success('Verification submitted!');
      setShowVerificationForm(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit verification');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (!pact) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-600">Pact not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="mb-6 text-blue-600 hover:text-blue-700"
          >
            ← Back
          </button>

          <div className="card mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{pact.title}</h1>
                <p className="text-slate-600 mt-2">{pact.description}</p>
              </div>
              <span className={`badge text-sm font-medium ${
                pact.status === 'completed'
                  ? 'badge-success'
                  : pact.status === 'failed'
                  ? 'badge-danger'
                  : 'badge-warning'
              }`}>
                {pact.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
              <div>
                <p className="text-slate-600 text-sm">Stake</p>
                <p className="font-bold text-lg">₹{pact.stake_amount}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Deadline</p>
                <p className="font-bold text-lg">{new Date(pact.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Owner</p>
                <p className="font-bold text-lg">
                  {pact.creator?.full_name || 'Unknown'}
                </p>
                <p className="text-slate-500 text-sm">@{pact.creator?.username}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Verifications</p>
                <p className="font-bold text-lg">{verifications.length}</p>
              </div>
            </div>
          </div>

          {/* Pact Actions Section */}
          {pact.creator_id !== user?.id && (
            <div className="mb-6">
              <button
                onClick={handleRequestJoinPact}
                className="btn-primary"
                type="button"
              >
                Request to Join Pact
              </button>
            </div>
          )}

          {/* Upload Proof Section */}
          {pact.status === 'active' && pact.creator_id === user?.id && (
            <div className="card mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Upload Proof</h2>
              <form onSubmit={handleUploadProof} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload file or take a photo
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    capture="environment"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="input-field"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Choose a file from your device, or take a photo/video if supported.
                  </p>
                </div>
                <button type="submit" className="btn-primary">
                  Upload Proof
                </button>
              </form>
            </div>
          )}

          {/* Verification Section */}
          {pact.status === 'completed' && pact.creator_id !== user?.id && (
            <div className="card mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4-Point Verification</h2>
              
              {!showVerificationForm ? (
                <button
                  onClick={() => setShowVerificationForm(true)}
                  className="btn-primary"
                >
                  Submit Verification
                </button>
              ) : (
                <form onSubmit={handleSubmitVerification} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Q1: Was the pact outcome clearly completed?
                    </label>
                    <select
                      value={verificationAnswers.q1}
                      onChange={(e) =>
                        setVerificationAnswers({ ...verificationAnswers, q1: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="unclear">Unclear</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Q2: Was the proof authentic and believable?
                    </label>
                    <select
                      value={verificationAnswers.q2}
                      onChange={(e) =>
                        setVerificationAnswers({ ...verificationAnswers, q2: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="authentic">Authentic</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="fake">Fake</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Q3: Was the pact completed according to original rules?
                    </label>
                    <select
                      value={verificationAnswers.q3}
                      onChange={(e) =>
                        setVerificationAnswers({ ...verificationAnswers, q3: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="fully_followed">Fully Followed</option>
                      <option value="partially_followed">Partially Followed</option>
                      <option value="violated">Violated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Q4: Would you stake your own reputation on this approval?
                    </label>
                    <select
                      value={verificationAnswers.q4}
                      onChange={(e) =>
                        setVerificationAnswers({ ...verificationAnswers, q4: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="yes_confident">Yes, Confident</option>
                      <option value="unsure">Unsure</option>
                      <option value="no_confident">No</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button type="submit" className="btn-primary flex-1">
                      Submit Verification
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVerificationForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Verifications List */}
          <div className="card">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Verifications</h2>
            {verifications.length === 0 ? (
              <p className="text-slate-600">No verifications yet</p>
            ) : (
              <div className="space-y-4">
                {verifications.map((verification) => (
                  <div key={verification.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-slate-900">Verifier #{verification.verifier_id}</p>
                      <span className="badge badge-success text-xs">
                        {(verification.confidence_score * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-600">Completion: <span className="font-medium">{verification.q1_answer}</span></p>
                        <p className="text-slate-600">Authenticity: <span className="font-medium">{verification.q2_answer}</span></p>
                      </div>
                      <div>
                        <p className="text-slate-600">Rule Adherence: <span className="font-medium">{verification.q3_answer}</span></p>
                        <p className="text-slate-600">Reputation: <span className="font-medium">{verification.q4_answer}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
