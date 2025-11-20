import React, { useRef, useEffect, useState } from 'react';
import { Camera, Video, Volume2, PenTool } from 'lucide-react';
import { handDetectionService } from '../services/mediaPipeService';
import { DetectionResult, AppStatus } from '../types';

interface WebcamViewProps {
  status: AppStatus;
  onResult: (result: DetectionResult) => void;
  onModelLoaded: () => void;
  onError: (msg: string) => void;
  isSoundPlaying?: boolean;
}

export const WebcamView: React.FC<WebcamViewProps> = ({ 
  status, 
  onResult, 
  onModelLoaded,
  onError,
  isSoundPlaying = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const requestRef = useRef<number>(0);
  
  // Store trails: Array of Arrays of Points {x, y, time}
  const trailsRef = useRef<{x: number, y: number, time: number}[][]>([]);

  // Initialize Model
  useEffect(() => {
    const init = async () => {
      try {
        await handDetectionService.initialize();
        onModelLoaded();
      } catch (err) {
        console.error("Failed to load MediaPipe model", err);
        onError("Failed to load AI Model. Please refresh.");
      }
    };
    init();
  }, [onModelLoaded, onError]);

  // Start Camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
        currentStream = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing camera:", err);
        onError("Could not access camera. Please ensure permissions are granted.");
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onError]);

  // Bind Stream to Video Element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [stream]);

  // Detection Loop
  const detect = () => {
    if (
      status === AppStatus.DETECTING && 
      videoRef.current && 
      videoRef.current.readyState >= 2 && 
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Match canvas size to video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Run detection
      const startTimeMs = performance.now();
      const results = handDetectionService.detect(video, startTimeMs);

      if (ctx) {
        // Clear previous drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results && results.landmarks.length > 0) {
           
           // Calculate Counts
           const handCounts = results.landmarks.map((l: any[]) => handDetectionService.countFingers(l));
           const totalFingers = handCounts.reduce((a: number, b: number) => a + b, 0);
           
           const now = Date.now();

           // --- TRAIL LOGIC (ALWAYS ON) ---
           // Sync trails array length with number of detected hands
           if (trailsRef.current.length > results.landmarks.length) {
             trailsRef.current = trailsRef.current.slice(0, results.landmarks.length);
           }
           while (trailsRef.current.length < results.landmarks.length) {
             trailsRef.current.push([]);
           }

           results.landmarks.forEach((landmarks: any[], index: number) => {
             const indexTip = landmarks[8]; // Index finger tip
             const trail = trailsRef.current[index];

             // A. Expire old points (older than 30 seconds)
             while (trail.length > 0 && (now - trail[0].time > 30000)) {
               trail.shift();
             }

             // B. Always add point
             trail.push({ x: indexTip.x, y: indexTip.y, time: now });
           });

           // Draw Trails
           handDetectionService.drawTrails(ctx, trailsRef.current);

           // Draw Skeleton
           handDetectionService.drawResults(ctx, results);
           
           onResult({
             fingerCount: totalFingers,
             isHandDetected: true,
             timestamp: Date.now()
           });
        } else {
           // No hands detected? 
           // We clear trails because we lose tracking of which hand is which.
           trailsRef.current = [];

           onResult({
             fingerCount: 0,
             isHandDetected: false,
             timestamp: Date.now()
           });
        }
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700 group">
      {!stream ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <Video size={48} className="mb-4 animate-pulse" />
          <p>Initializing Camera...</p>
        </div>
      ) : (
        <>
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          
          {/* Canvas Overlay for Skeleton & Trails */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transform scale-x-[-1] pointer-events-none"
          />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-20">
             {status === AppStatus.DETECTING ? (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
                 LIVE
               </div>
             ) : (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm text-slate-300 text-xs font-bold rounded-full shadow-lg">
                 <Camera size={12} />
                 READY
               </div>
             )}
          </div>

          {/* Sound Indicator */}
          {isSoundPlaying && (
            <div className="absolute bottom-4 right-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/90 backdrop-blur-md rounded-full shadow-xl text-white">
                <Volume2 size={20} className="animate-pulse" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};