'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePact } from '@/hooks/usePacts';
import { useAuthStore } from '@/store/auth';
import { joinRequestService, pactService, verificationService } from '@/services/api';
import { Pact, Verification } from '@/types';
import toast from 'react-hot-toast';
import PremiumLayout from '@/layouts/PremiumLayout';
import PactHero from '@/components/premium/PactHero';
import PremiumCard from '@/components/premium/PremiumCard';
import ProofsSection from '@/components/ProofsSection';
import { Upload, Users, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: pactData, isLoading: pactLoading } = usePact(Number(params.id));
  const pact = pactData?.data;
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationAnswers, setVerificationAnswers] = useState({
    q1: 'yes',
    q2: 'authentic',
    q3: 'fully_followed',
    q4: 'yes_confident',
  });

  useEffect(() => {
    if (pact?.id) {
      verificationService.getByPactId(pact.id).then((res) => {
        setVerifications(res.data);
      });
    }
  }, [pact?.id]);

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

  if (pactLoading) {
    return <PremiumLayout showNav={false}>Loading...</PremiumLayout>;
  }

  if (!pact) {
    return (
      <PremiumLayout showNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-600">Pact not found</p>
        </div>
      </PremiumLayout>
    );
  }

  return (
    <PremiumLayout showNav={false}>
      <PactHero pact={pact} />

      <div className="px-4 py-6 space-y-6">
        {/* Members Section */}
        <PremiumCard>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-slate-900">Members</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400" />
            ))}
          </div>
        </PremiumCard>

        {/* Upload Proof */}
        {pact.status === 'active' && pact.creator_id === user?.id && (
          <PremiumCard>
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Daily Proof
            </h2>
            <form onSubmit={handleUploadProof} className="space-y-4">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all"
              >
                Upload Proof
              </button>
            </form>
          </PremiumCard>
        )}

        {/* Proofs Section - Instagram Style */}
        <PremiumCard>
          <ProofsSection
            proofs={[
              {
                id: 1,
                url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
                type: 'image',
                description: 'Started the project setup',
                day: 1,
                uploadedAt: '2024-01-15',
                uploader: pact?.creator_id ? 'You' : 'Creator',
              },
              {
                id: 2,
                url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
                type: 'image',
                description: 'API integration complete',
                day: 3,
                uploadedAt: '2024-01-17',
                uploader: pact?.creator_id ? 'You' : 'Creator',
              },
              {
                id: 3,
                url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
                type: 'image',
                description: 'Database migrations done',
                day: 5,
                uploadedAt: '2024-01-19',
                uploader: pact?.creator_id ? 'You' : 'Creator',
              },
            ]}
            title="Daily Progress"
          />
        </PremiumCard>

        {/* Verification Section */}
        {verifications.length > 0 && (
          <PremiumCard>
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Verifications ({verifications.length})
            </h2>
            <div className="space-y-3">
              {verifications.map((v) => (
                <div key={v.id} className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700">
                    Confidence: {(v.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </PremiumCard>
        )}

        {/* Comments Section */}
        <PremiumCard>
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussion
          </h2>
          <p className="text-slate-600 text-sm">No comments yet. Be the first!</p>
        </PremiumCard>
      </div>
    </PremiumLayout>
  );
}
