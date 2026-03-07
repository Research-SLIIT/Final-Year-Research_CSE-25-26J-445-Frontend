'use client';

import React, { useState } from 'react';
import Latex from './Latex'; // <--- UPDATED IMPORT
import { GlossaryComponent, GlossaryMap } from '@/lib/types/dividend/glossary'; 

interface ModalProps {
  initialKey: string;     
  glossary: GlossaryMap;  
  onClose: () => void;
}

const FeatureExplanationModal: React.FC<ModalProps> = ({ initialKey, glossary, onClose }) => {
  // Navigation History Stack
  const [history, setHistory] = useState<string[]>([initialKey]);

  // Always show the LAST item in history
  const currentKey = history[history.length - 1];
  const currentData = glossary[currentKey];

  // Navigate to new definition
  const handleNavigate = (key: string) => {
    if (glossary[key]) {
      setHistory((prev) => [...prev, key]);
    }
  };

  // Go back
  const handleBack = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  if (!currentData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="flex items-center justify-between border-b p-4 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            {/* BACK Button */}
            {history.length > 1 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                ← Back
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 truncate max-w-[250px]">
              {currentData.label}
            </h2>
          </div>
          
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* --- Content --- */}
        <div className="overflow-y-auto p-6">
          
          <p className="mb-6 text-black dark:text-black font-bold leading-relaxed text-sm md:text-base">
            {currentData.description}
          </p>

          {/* Math Display - Uses your custom component now */}
          <div className="mb-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 text-center text-lg shadow-sm">
            {currentData.equation ? (
              <Latex block={true}>{currentData.equation}</Latex>
            ) : (
              <p className="text-sm text-gray-400">No equation available</p>
            )}
          </div>

          <hr className="mb-6 border-gray-100 dark:border-gray-700" />

          {/* Variables List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              Understanding the Variables
            </h3>
            
            {currentData.components.map((comp, idx) => (
              <VariableRow 
                key={idx} 
                component={comp} 
                onLinkClick={handleNavigate} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: Interactive Variable Row ---
const VariableRow: React.FC<{ 
  component: GlossaryComponent; 
  onLinkClick: (key: string) => void;
}> = ({ component, onLinkClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLink = !!component.link_to_feature;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLink) {
      onLinkClick(component.link_to_feature!); 
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`cursor-pointer rounded-lg border transition-all duration-200 overflow-hidden group
        ${isLink 
          ? 'border-blue-100 bg-blue-50 hover:border-blue-300 hover:shadow-sm' 
          : isOpen ? 'border-gray-200 bg-gray-50' : 'border-transparent hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <span className="min-w-[40px] text-center rounded bg-white px-2 py-1 font-serif italic text-gray-800 shadow-sm border border-gray-100">
            {component.symbol}
          </span>
          
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${isLink ? 'text-blue-700 underline decoration-blue-300 underline-offset-2' : 'text-gray-700'}`}>
              {isLink ? `See definition: ${component.symbol}` : component.symbol}
            </span>
          </div>
        </div>
        <span className={`text-gray-400 transition-transform duration-200`}>
          {isLink ? '↗' : (isOpen ? '▼' : '▶')}
        </span>
      </div>

      {!isLink && isOpen && (
        <div className="px-3 pb-3 pt-0 ml-[52px]">
          <p className="text-sm text-gray-600 border-l-2 border-blue-400 pl-2">
            {component.definition}
          </p>
        </div>
      )}
    </div>
  );
};

export default FeatureExplanationModal;