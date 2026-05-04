'use client';

import React, { useState } from 'react';
import FeatureExplanationModal from './FeatureExplanationModal';
import { GlossaryMap } from '@/lib/types/dividend/glossary';

interface FeatureCardProps {
  featureKey: string;
  value: string | number;
  glossary: GlossaryMap;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ featureKey, value, glossary }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const meta = glossary[featureKey];

  // Fallback (Loading State or Missing Data)
  if (!meta) {
    return (
      <div className="p-4 rounded-lg border bg-white shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={() => setModalOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-300"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-l font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {meta.label}
          </span>
          <span className="text-gray-900 group-hover:text-blue-500">ℹ️</span>
        </div>
        
        <div className="text-medium font-medium text-gray-900">
          {value}
        </div>
      </div>

      {isModalOpen && (
        <FeatureExplanationModal 
          initialKey={featureKey} 
          glossary={glossary} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </>
  );
};

export default FeatureCard;