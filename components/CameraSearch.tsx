
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AppStatus } from '../types';

interface CameraSearchProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  status: AppStatus;
}

export const CameraSearch: React.FC<CameraSearchProps> = ({ onCapture, onClose, status }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-50 bg-[#064e3b] flex flex-col items-center justify-center text-white p-6">
        <p className="text-xl mb-4 font-bold">Camera access denied.</p>
        <button onClick={onClose} className="bg-white text-[#064e3b] px-8 py-3 rounded-full font-bold">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col">
      {/* Viewport */}
      <div className="relative flex-1 bg-gray-900">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#064e3b] -mt-1 -ml-1 rounded-tl-lg shadow-[0_0_15px_rgba(6,78,59,0.5)]"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#064e3b] -mt-1 -mr-1 rounded-tr-lg shadow-[0_0_15px_rgba(6,78,59,0.5)]"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#064e3b] -mb-1 -ml-1 rounded-bl-lg shadow-[0_0_15px_rgba(6,78,59,0.5)]"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#064e3b] -mb-1 -mr-1 rounded-br-lg shadow-[0_0_15px_rgba(6,78,59,0.5)]"></div>
            
            {status === AppStatus.SEARCHING && (
              <div className="absolute inset-0 bg-[#064e3b]/20 animate-pulse rounded-3xl overflow-hidden">
                <div className="w-full h-1 bg-[#064e3b] absolute top-0 left-0 animate-[scan_2s_infinite] shadow-[0_0_20px_#064e3b]"></div>
              </div>
            )}
          </div>
        </div>

        {/* UI Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <button 
            onClick={onClose}
            className="pointer-events-auto p-3 rounded-full bg-black/40 text-white hover:bg-[#064e3b] transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pointer-events-auto bg-[#064e3b]/80 px-5 py-2 rounded-full text-white text-sm font-bold backdrop-blur-md shadow-lg">
            {status === AppStatus.SEARCHING ? 'Terrua AI is analyzing...' : 'Align product or barcode'}
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8">
           <button 
            onClick={captureFrame}
            disabled={status === AppStatus.SEARCHING}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 transition ${status === AppStatus.SEARCHING ? 'opacity-50 cursor-not-allowed' : 'active:scale-90 hover:border-[#064e3b]'}`}
           >
            <div className={`w-full h-full ${status === AppStatus.SEARCHING ? 'bg-gray-400' : 'bg-white'} rounded-full transition-colors`}></div>
           </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(256px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
