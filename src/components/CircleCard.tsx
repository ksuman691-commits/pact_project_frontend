'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Lock, Globe, Star, ChevronRight } from 'lucide-react';
import JoinCircleModal from './JoinCircleModal';

interface CircleCardProps {
  circle: {
    id: number;
    name: string;
    description: string;
    avatar?: string;
    memberCount: number;
    isPrivate: boolean;
    isJoined: boolean;
    isTrending?: boolean;
    memberList?: string[];
    winRate?: number;
  };
  onJoin?: (circleId: number) => void;
}

export default function CircleCard({ circle, onJoin }: CircleCardProps) {
  const [joinModal, setJoinModal] = useState(false);

  const handleJoinClick = () => {
    if (circle.isPrivate) {
      setJoinModal(true);
    } else {
      onJoin?.(circle.id);
    }
  };

  return (
    <>
      <Link href={`/circles/${circle.id}`}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer h-full">
          {/* Circle Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                    {circle.name}
                  </h3>
                  {circle.isTrending && (
                    <Star className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {circle.description}
                </p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {circle.avatar || circle.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Circle Stats */}
          <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Members</p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-lg font-bold text-gray-900">
                  {circle.memberCount}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Type</p>
              <div className="flex items-center gap-2">
                {circle.isPrivate ? (
                  <>
                    <Lock className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Public</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Member Avatars */}
          {circle.memberList && circle.memberList.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-600 font-medium mb-3">Recent Members</p>
              <div className="flex -space-x-2">
                {circle.memberList.slice(0, 5).map((member, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    title={member}
                  >
                    {member.charAt(0)}
                  </div>
                ))}
                {circle.memberList.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white">
                    +{circle.memberList.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="px-6 py-4">
            {circle.isJoined ? (
              <button className="w-full flex items-center justify-between px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-medium text-sm hover:bg-emerald-100 transition">
                <span>Joined</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleJoinClick();
                }}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition"
              >
                Join Circle
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Join Modal */}
      <JoinCircleModal
        isOpen={joinModal}
        onClose={() => setJoinModal(false)}
        circle={circle}
        onJoin={onJoin}
      />
    </>
  );
}
