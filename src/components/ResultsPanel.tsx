import React from 'react';
import { DetectionResult } from '../types';
import { Hand, Activity } from 'lucide-react';

interface ResultsPanelProps {
  result: DetectionResult | null;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  const count = result?.fingerCount ?? 0;
  const isDetected = result?.isHandDetected ?? false;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Main Count Display */}
      <div className="flex-1 relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 p-8 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-50"></div>
        
        {/* Dynamic Glow */}
        {isDetected && (
          <div className="absolute inset-0 bg-indigo-500/20 animate-pulse blur-3xl"></div>
        )}

        <div className="relative z-10">
          <h2 className="text-slate-400 uppercase tracking-[0.2em] text-sm font-bold mb-4">
            Finger Count
          </h2>
          
          <div className={`text-[12rem] leading-none font-black tabular-nums transition-all duration-150 ${isDetected ? 'text-white scale-110' : 'text-slate-700 scale-100'}`}>
            {isDetected ? count : '-'}
          </div>
          
          <div className="mt-4 h-8 flex items-center justify-center">
            {isDetected ? (
               <div className="px-4 py-1 bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 rounded-full text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                  HAND DETECTED
               </div>
            ) : (
               <div className="text-slate-600 text-sm font-medium flex items-center gap-2">
                 <Hand size={16} />
                 Waiting for hand...
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Info / Instructions */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-3 text-slate-300">
          <Activity size={20} className="text-indigo-400" />
          <span className="font-bold">Live Analysis</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          The AI is tracking hand landmarks in real-time. Show your hand clearly to the camera to update the counter instantly.
        </p>
      </div>
    </div>
  );
};