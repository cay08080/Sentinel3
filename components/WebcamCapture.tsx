import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface WebcamCaptureRef {
  triggerManualCapture: () => void;
}

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  onNoMotion: () => void;
  intervalMs: number;
  isActive: boolean;
  sensitivity: number;
  width: number;
  height: number;
}

export const WebcamCapture = forwardRef<WebcamCaptureRef, WebcamCaptureProps>(({ 
  onCapture, 
  onNoMotion,
  intervalMs,
  isActive,
  sensitivity,
  width,
  height
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionLevel, setMotionLevel] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !canvasRef.current) return null;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return null;

    canvasRef.current.width = videoRef.current.videoWidth || width;
    canvasRef.current.height = videoRef.current.videoHeight || height;
    canvasCtx.drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg', 0.8);
  }, [width, height]);

  useImperativeHandle(ref, () => ({
    triggerManualCapture: () => {
      const img = captureCurrentFrame();
      if (img) onCapture(img);
    }
  }));

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isActive) return;
      
      try {
        setCameraError(null);
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: width }, 
            height: { ideal: height },
            facingMode: "environment" 
          }
        });
        
        currentStream = s;
        setStream(s);
        
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.warn("Autoplay bloqueado", e));
          };
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        setCameraError("Câmera indisponível ou permissão negada.");
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
      setStream(null);
    };
  }, [isActive, width, height]);

  const checkMotion = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return false;
    
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 40;
    offCanvas.height = 30;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return true;

    ctx.drawImage(videoRef.current, 0, 0, 40, 30);
    const current = ctx.getImageData(0, 0, 40, 30).data;

    if (!prevFrameDataRef.current) {
      prevFrameDataRef.current = current;
      return true;
    }

    let diff = 0;
    for (let i = 0; i < current.length; i += 4) {
      diff += Math.abs(current[i] - prevFrameDataRef.current[i]);
    }

    const normalizedDiff = (diff / (40 * 30 * 255)) * 100;
    setMotionLevel(normalizedDiff * 15);
    prevFrameDataRef.current = current;

    const threshold = (101 - sensitivity) / 10;
    return normalizedDiff > threshold;
  }, [sensitivity]);

  useEffect(() => {
    let itv: any;
    if (isActive && stream) {
      itv = setInterval(() => {
        if (checkMotion()) {
          const img = captureCurrentFrame();
          if (img) onCapture(img);
        } else {
          onNoMotion();
        }
      }, intervalMs);
    }
    return () => clearInterval(itv);
  }, [isActive, stream, intervalMs, checkMotion, captureCurrentFrame, onCapture, onNoMotion]);

  const thresholdLine = (101 - sensitivity) / 10 * 10;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video shadow-2xl flex items-center justify-center">
      {cameraError ? (
        <div className="text-center p-6 space-y-4">
          <div className="text-4xl">🚫</div>
          <p className="text-red-400 text-sm font-bold uppercase tracking-widest">{cameraError}</p>
        </div>
      ) : !isActive ? (
        <div className="text-center p-6 space-y-2 opacity-40">
          <div className="text-4xl">📷</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sentinela em Standby</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-2 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            SENTINEL LIVE
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900/80">
            <div 
              className={`h-full transition-all duration-300 ${motionLevel > thresholdLine ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-600/50'}`}
              style={{ width: `${Math.min(100, (motionLevel / (thresholdLine * 2)) * 100)}%` }}
            />
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

WebcamCapture.displayName = "WebcamCapture";