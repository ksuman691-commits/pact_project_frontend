'use client';

import React, { useState } from 'react';
import { Flame, Vote, BarChart3, Activity, Palette, Leaf, DollarSign, LineChart, Zap } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'trending',
    name: 'Trending',
    icon: <Flame className="w-5 h-5" />,
    color: ' ',
    description: 'Hot pacts right now',
  },
  {
    id: 'elections',
    name: 'Elections',
    icon: <Vote className="w-5 h-5" />,
    color: ' ',
    description: 'Political commitments',
  },
  {
    id: 'politics',
    name: 'Politics',
    icon: <BarChart3 className="w-5 h-5" />,
    color: ' ',
    description: 'Policy & advocacy',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: <Activity className="w-5 h-5" />,
    color: ' ',
    description: 'Athletic goals',
  },
  {
    id: 'culture',
    name: 'Culture',
    icon: <Palette className="w-5 h-5" />,
    color: ' ',
    description: 'Arts & creativity',
  },
  {
    id: 'climate',
    name: 'Climate',
    icon: <Leaf className="w-5 h-5" />,
    color: ' ',
    description: 'Environmental impact',
  },
  {
    id: 'commodities',
    name: 'Commodities',
    icon: <BarChart3 className="w-5 h-5" />,
    color: ' ',
    description: 'Trading & goods',
  },
  {
    id: 'economics',
    name: 'Economics',
    icon: <LineChart className="w-5 h-5" />,
    color: ' ',
    description: 'Economic insights',
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: <DollarSign className="w-5 h-5" />,
    color: ' ',
    description: 'Financial goals',
  },
  {
    id: 'tech-science',
    name: 'Tech & Science',
    icon: <Zap className="w-5 h-5" />,
    color: ' ',
    description: 'Innovation & discovery',
  },
];

interface CategorySectionProps {
  onCategorySelect?: (categoryId: string) => void;
  onCreatePact?: () => void;
}

export default function CategorySection({ onCategorySelect, onCreatePact }: CategorySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect?.(categoryId);
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h2 className="text-xs font-bold text-[#6B7280] mb-4">
          Create Pact by Category
        </h2>
        <p className="text-xs text-[#9CA3AF] mb-4">Select a category to create your pact</p>
      </div>

      {/* Horizontal scrollable categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`flex-shrink-0 snap-start transition-all transform hover:scale-105 active:scale-95 ${
              selectedCategory === category.id ? 'ring-2 ring-offset-2 ring-[var(--muted)]' : ''
            }`}
          >
            <div
              className={`bg-[var(--navy)] rounded-[24px] p-4 w-32 h-32 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="mb-2 text-white">{category.icon}</div>
              <p className="text-sm font-semibold text-center">{category.name}</p>
              <p className="text-xs text-white/80 text-center mt-1">{category.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Create Pact Button - appears when category selected */}
      <div className={`mt-6 transition-all duration-300 overflow-hidden ${selectedCategory ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
        <button
          onClick={() => {
            onCreatePact?.();
            setSelectedCategory(null);
          }}
          className="w-full py-4 bg-[var(--navy)] text-white font-bold rounded-[24px] shadow-lg hover:bg-[var(--navy-hover)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Create Pact in {CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Category'}</span>
        </button>
      </div>
    </div>
  );
}
