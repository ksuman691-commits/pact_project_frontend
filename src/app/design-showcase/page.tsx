'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, Plus, Settings, Search, Zap } from 'lucide-react';
import Image from 'next/image';

export default function DesignShowcase() {
  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Modern Vibrant Design System</h1>
        <p className="text-lg text-slate-600 mb-12">CirclePact with bold gradients, high contrast, and engaging visual hierarchy</p>

        {/* 1. Header */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Header Navigation</h2>
          <div className="bg-white border-b border-slate-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">CirclePact</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-full transition">
                  <Search className="w-5 h-5 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-full transition">
                  <Settings className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Pact Card - Modern Style */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Pact Cards - Vibrant Design</h2>
          <div className="grid gap-6">
            {/* Card 1 */}
            <div className="rounded-3xl overflow-hidden bg-white border border-slate-100/60 shadow-xl hover:shadow-2xl transition-all duration-300">
              {/* Image with Gradient Overlay */}
              <div className="relative aspect-video bg-gradient-to-br from-purple-500 via-blue-500 to-emerald-400 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-emerald-400/20 pointer-events-none" />
                
                {/* Urgency Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-red-500 shadow-lg">
                  URGENT
                </div>

                {/* Proof Count */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-xl rounded-full text-xs font-bold text-slate-900 shadow-xl border border-white/80">
                  📸 3 proofs
                </div>

                {/* Time Badge */}
                <div className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-lg rounded-full text-sm font-bold text-slate-900 shadow-lg">
                  2 days left
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pt-4 pb-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white">
                    AJ
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Alex Johnson</p>
                    <p className="text-xs text-slate-600 font-medium">@alexjohnson • Fitness</p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">Complete 10km Run Daily</h3>
                <p className="text-sm text-slate-700 mb-4">Join me in my challenge to run 10km every day for 30 days. Let&apos;s build this habit together!</p>

                {/* Stats - Vibrant */}
                <div className="flex gap-3 mb-4 py-3 border-y border-slate-200">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">245</div>
                    <div className="text-xs text-slate-600">Believe</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-400 bg-clip-text text-transparent">34</div>
                    <div className="text-xs text-slate-600">Doubt</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">12</div>
                    <div className="text-xs text-slate-600">Comments</div>
                  </div>
                </div>

                {/* Action Buttons - Bold CTA */}
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg">
                    ✓ Believe
                  </button>
                  <button className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all">
                    ✗ Doubt
                  </button>
                  <button className="px-4 py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl transition">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 - Different Color Scheme */}
            <div className="rounded-3xl overflow-hidden bg-white border border-slate-100/60 shadow-xl">
              <div className="relative aspect-video bg-gradient-to-br from-orange-400 via-pink-500 to-red-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 via-transparent to-pink-400/10" />
                
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-amber-500 shadow-lg">
                  SOON
                </div>

                <div className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-lg rounded-full text-sm font-bold text-slate-900 shadow-lg">
                  5 days left
                </div>
              </div>

              <div className="px-6 pt-4 pb-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 via-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white">
                    SM
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Sarah Martinez</p>
                    <p className="text-xs text-slate-600 font-medium">@sarahm • Reading</p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">Finish a Book This Week</h3>
                <p className="text-sm text-slate-700 mb-4">Reading 50 pages daily to complete my book by Friday. Who&apos;s joining?</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Profile Card */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Card - Bold Accent</h2>
          <div className="max-w-md rounded-3xl overflow-hidden bg-white border border-slate-100/60 shadow-xl">
            {/* Header Background with Gradient */}
            <div className="h-24 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-14 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-2xl font-bold text-slate-700 shadow-lg ring-4 ring-white">
                  A
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">Alex Johnson</h2>
              <p className="text-sm text-slate-600 font-medium mb-4">@alexjohnson</p>

              {/* Stats - Vibrant */}
              <div className="grid grid-cols-3 gap-3 mb-6 py-4 border-y border-slate-200">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">24</div>
                  <div className="text-xs text-slate-600 mt-1">Pacts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-400 bg-clip-text text-transparent">18.9k</div>
                  <div className="text-xs text-slate-600 mt-1">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">12</div>
                  <div className="text-xs text-slate-600 mt-1">Following</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md">
                  Follow
                </button>
                <button className="flex-1 px-4 py-2 border-2 border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition">
                  Message
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Color Palette */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Color Palette & Gradients</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Emerald (Primary) */}
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="h-24 bg-gradient-to-br from-emerald-400 to-emerald-600" />
              <div className="bg-white p-4">
                <p className="font-bold text-slate-900">Emerald</p>
                <p className="text-xs text-slate-600">Primary</p>
              </div>
            </div>

            {/* Purple-Blue */}
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="h-24 bg-gradient-to-br from-purple-500 to-blue-600" />
              <div className="bg-white p-4">
                <p className="font-bold text-slate-900">Purple-Blue</p>
                <p className="text-xs text-slate-600">Accent</p>
              </div>
            </div>

            {/* Orange-Pink */}
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="h-24 bg-gradient-to-br from-orange-400 to-pink-500" />
              <div className="bg-white p-4">
                <p className="font-bold text-slate-900">Orange-Pink</p>
                <p className="text-xs text-slate-600">Highlight</p>
              </div>
            </div>

            {/* Red-Orange */}
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="h-24 bg-gradient-to-br from-red-500 to-orange-500" />
              <div className="bg-white p-4">
                <p className="font-bold text-slate-900">Red-Orange</p>
                <p className="text-xs text-slate-600">Urgency</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Design Principles */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Design Principles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Bold Typography', desc: 'Use font-bold and larger sizes for impact' },
              { title: 'Vibrant Gradients', desc: 'Combine colors for dynamic visual interest' },
              { title: 'High Contrast', desc: 'White backgrounds with colorful accents' },
              { title: 'Rounded Corners', desc: 'Use rounded-3xl for modern appearance' },
              { title: 'Shadow & Depth', desc: 'shadow-lg and shadow-xl for visual hierarchy' },
              { title: 'Ring Accents', desc: 'Use ring-2 ring-white for subtle borders' },
            ].map((principle, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 transition">
                <h3 className="font-bold text-slate-900 mb-1">{principle.title}</h3>
                <p className="text-sm text-slate-600">{principle.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
