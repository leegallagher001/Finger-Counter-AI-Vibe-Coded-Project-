import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WebcamView } from './components/WebcamView';
import { ResultsPanel } from './components/ResultsPanel';
import { AppStatus, DetectionResult } from './types';
import { Activity, Play, Square, Loader2 } from 'lucide-react';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING_MODEL);
  const [currentResult, setCurrentResult] = useState<DetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sound state
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const prevCountRef = useRef<number>(0);
  const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleModelLoaded = useCallback(() => {
    setStatus(AppStatus.IDLE);
  }, []);

  const handleError = useCallback((msg: string) => {
    setStatus(AppStatus.ERROR);
    setErrorMsg(msg);
  }, []);

  const handleResult = useCallback((result: DetectionResult) => {
    setCurrentResult(result);
  }, []);

  // Sound Logic: Trigger when finger count CHANGES to a new non-zero number
  useEffect(() => {
    const count = currentResult?.fingerCount ?? 0;
    const prevCount = prevCountRef.current;

    // Play sound if detecting, count is > 0, and count has changed
    if (status === AppStatus.DETECTING && count > 0 && count !== prevCount) {
      soundService.playNote(count);
      
      // Trigger visual indicator
      setIsSoundPlaying(true);
      
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
      }
      
      soundTimeoutRef.current = setTimeout(() => {
        setIsSoundPlaying(false);
      }, 400);
    }

    prevCountRef.current = count;
  }, [currentResult, status]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
    };
  }, []);

  const toggleDetection = () => {
    // Initialize audio context on user gesture (browser requirement)
    soundService.init();

    if (status === AppStatus.IDLE) {
      setStatus(AppStatus.DETECTING);
    } else if (status === AppStatus.DETECTING) {
      setStatus(AppStatus.IDLE);
      setCurrentResult(null);
      setIsSoundPlaying(false);
      prevCountRef.current = 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto min-h-[calc(100vh-3rem)] flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/20 h-fit">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Finger Counter AI
              </h1>
              <p className="text-slate-500 text-xs tracking-wide uppercase font-semibold">Powered by MediaPipe</p>
              <p className="text-slate-400 text-sm mt-1 max-w-md hidden md:block">
                Real-time musical instrument controlled by your fingers. Draw in the air to visualize your performance!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {errorMsg && (
               <div className="hidden md:block text-red-400 text-sm font-bold px-4 py-2 bg-red-900/20 rounded-lg border border-red-900/50">
                 {errorMsg}
               </div>
            )}

            <button
              onClick={toggleDetection}
              disabled={status === AppStatus.LOADING_MODEL || status === AppStatus.ERROR}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg
                ${status === AppStatus.LOADING_MODEL 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : status === AppStatus.DETECTING 
                    ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-400/30 hover:scale-105' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400/30 hover:scale-105'}
              `}
            >
              {status === AppStatus.LOADING_MODEL ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading Model...
                </>
              ) : status === AppStatus.DETECTING ? (
                <>
                  <Square size={18} fill="currentColor" />
                  Stop
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Start Detection
                </>
              )}
            </button>
          </div>
        </header>
        
        {/* Mobile Description (visible only on small screens) */}
        <div className="md:hidden mb-4 text-slate-400 text-sm">
          Real-time musical instrument controlled by your fingers. Draw in the air to visualize your performance!
        </div>

        {/* Main Layout - Grid split for Side-by-Side View */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Camera Window - Order 1 on mobile, Order 2 on desktop (Right side) */}
          <div className="order-1 lg:order-2 lg:col-span-8 relative flex flex-col min-h-[300px] lg:min-h-0">
             <WebcamView 
               status={status}
               onResult={handleResult}
               onModelLoaded={handleModelLoaded}
               onError={handleError}
               isSoundPlaying={isSoundPlaying}
             />
          </div>

          {/* Side Panel (Results) - Order 2 on mobile, Order 1 on desktop (Left side) */}
          <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col min-h-[400px]">
            <ResultsPanel result={currentResult} />
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;