'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePact } from '@/hooks/usePacts';
import { Share2, MessageCircle, Upload, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import TopNav from '@/components/TopNav';
import VerificationModal from '@/components/VerificationModal';
import ProofUploadModal from '@/components/ProofUploadModal';
import CommentSection from '@/components/CommentSection';

export default function PactDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: pactData, isLoading, isError } = usePact(Number(params.id));
  
  const [verificationModal, setVerificationModal] = useState(false);
  const [proofUploadModal, setProofUploadModal] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [comments, setComments] = useState([
    { id: 1, user: 'dev_pro', text: 'Always delivers 🔥', timestamp: '2h ago', likes: 234 },
    { id: 2, user: 'startup_judge', text: '7 days is tough', timestamp: '1h ago', likes: 145 },
  ]);

  // Timeout after 10 seconds if still loading
  useEffect(() => {
    if (!isLoading && !isError) return;
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadTimeout(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoading, isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Loading pact details...</p>
          {loadTimeout && (
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Still loading? Try refreshing
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isError || !pactData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Pact not found</h2>
          <p className="text-gray-600 mb-6">
            This pact doesn&apos;t exist or couldn&apos;t be loaded. It may have been deleted.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const pact = pactData?.data || {
    id: 1,
    creator: 'Aniket',
    avatar: '🔥',
    title: 'Ship MVP in 7 days',
    category: 'Startup',
    daysTotal: 7,
    daysCurrent: 2,
    confidence: 73,
    believers: 3420,
    doubters: 1250,
    timeRemaining: '2d 14h',
    progressPercentage: 28,
    description: 'Build and launch the MVP for my startup idea with all core features working.',
    proofClips: [
      { day: 1, type: 'coding', text: 'Started backend setup' },
      { day: 2, type: 'checkpoint', text: 'API endpoints complete' },
    ],
    comments: [
      { user: 'dev_pro', text: 'Always delivers 🔥', likes: 234 },
      { user: 'startup_judge', text: '7 days is tough', likes: 145 },
    ],
  };

  const handleVerificationSubmit = () => {
    setVerificationModal(false);
    toast.success('Progress verification submitted!');
  };

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-white pb-12 max-w-md mx-auto">
        {/* Pact Title Header */}
        <div className="sticky top-24 bg-white border-b border-gray-100 px-4 py-3 z-20">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-gray-900 flex-1">{pact.title}</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition ml-2">
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
        {/* Creator Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-300 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
              {pact.avatar}
            </div>
            <div>
              <p className="font-bold text-gray-900">@{pact.creator}</p>
              <p className="text-sm text-gray-600">Day {pact.daysCurrent}/{pact.daysTotal}</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{pact.description || 'No description provided.'}</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600 font-medium">Confidence</p>
              <p className="font-bold text-emerald-600">{pact.confidence}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Believe</p>
              <p className="font-bold text-blue-600">{(pact.believers / 1000).toFixed(1)}k</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Doubt</p>
              <p className="font-bold text-red-600">{(pact.doubters / 1000).toFixed(1)}k</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Time Left</p>
              <p className="font-bold text-orange-600">{pact.timeRemaining}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full transition-all"
              style={{ width: `${pact.progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">Progress: {pact.progressPercentage}% complete</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setVerificationModal(true)}
            className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <span className="text-lg">✓</span>
            Verify
          </button>
          <button
            onClick={() => setProofUploadModal(true)}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Proof
          </button>
        </div>

        {/* Proof Gallery */}
        {pact.proofClips && pact.proofClips.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Proof Clips ({pact.proofClips.length})</h2>
            <div className="space-y-3">
              {pact.proofClips.map((clip: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">Day {clip.day}: {clip.text}</p>
                    <span className="text-2xl">{clip.type === 'coding' ? '💻' : clip.type === 'checkpoint' ? '✅' : '📷'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-sm bg-gradient-to-r from-green-50 to-red-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <span className="text-lg">✓</span>
            <span>{(pact.believers / 1000).toFixed(1)}k Believe</span>
          </div>
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <span className="text-lg">✗</span>
            <span>{(pact.doubters / 1000).toFixed(1)}k Doubt</span>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-medium">
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length}</span>
          </div>
        </div>

        {/* Members */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Participants ({4})</h2>
          <div className="flex -space-x-2">
            {[
              { name: 'A', bg: 'from-emerald-400 to-emerald-600' },
              { name: 'P', bg: 'from-blue-400 to-blue-600' },
              { name: 'R', bg: 'from-purple-400 to-purple-600' },
              { name: 'S', bg: 'from-pink-400 to-pink-600' },
            ].map((member, idx) => (
              <div 
                key={idx}
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${member.bg} flex items-center justify-center text-white text-xs font-bold border-2 border-white hover:scale-110 transition-transform cursor-pointer`}
                title={`Participant ${member.name}`}
              >
                {member.name}
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Discussion</h2>
          <CommentSection
            pactId={pact.id}
            comments={comments}
            onAddComment={(pactId, text) => {
              setComments([
                {
                  id: Date.now(),
                  user: 'You',
                  text,
                  timestamp: 'now',
                  likes: 0,
                },
                ...comments,
              ]);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <VerificationModal
        isOpen={verificationModal}
        onClose={() => setVerificationModal(false)}
        pactId={pact.id}
        onSubmit={handleVerificationSubmit}
      />
      <ProofUploadModal
        isOpen={proofUploadModal}
        onClose={() => setProofUploadModal(false)}
        pactId={pact.id}
        onUpload={(pactId) => {
          toast.success('Proof uploaded! Waiting for verification...');
          setProofUploadModal(false);
        }}
      />
    </div>
    </>
  );
}
