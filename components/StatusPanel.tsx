import React from 'react';
import { DetectionStatus, AnalysisResult } from '../types';

interface StatusPanelProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ result, isAnalyzing }) => {
  if (!result && !isAnalyzing) {
    return (
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-center h-48 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-pulse grayscale opacity-30">👁️</div>
          <p className="text-slate-500 text-sm">Sistema em Standby</p>
        </div>
      </div>
    );
  }

  // Determine styles based on status
  let bgColor = "bg-slate-800";
  let borderColor = "border-slate-700";
  let textColor = "text-white";
  let icon = "🔍";

  if (result) {
    switch (result.status) {
      case DetectionStatus.PERSON_DETECTED:
        bgColor = "bg-yellow-500/10";
        borderColor = "border-yellow-500/50";
        textColor = "text-yellow-400";
        icon = "⚠️";
        break;
      case DetectionStatus.NO_PERSON:
        bgColor = "bg-emerald-500/10";
        borderColor = "border-emerald-500/50";
        textColor = "text-emerald-400";
        icon = "✅";
        break;
      case DetectionStatus.STATIC_SCENE:
        bgColor = "bg-blue-500/5";
        borderColor = "border-blue-500/20";
        textColor = "text-blue-400";
        icon = "💤";
        break;
      case DetectionStatus.COOLDOWN:
        bgColor = "bg-orange-500/10";
        borderColor = "border-orange-500/40";
        textColor = "text-orange-400";
        icon = "⏳";
        break;
      case DetectionStatus.ERROR:
        bgColor = "bg-red-500/10";
        borderColor = "border-red-500/50";
        textColor = "text-red-400";
        icon = "🛑";
        break;
      default:
        break;
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} transition-all duration-500 shadow-xl h-48 group`}>
      {isAnalyzing && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-shimmer"></div>
      )}
      
      <div className="h-full flex flex-col items-center justify-center text-center p-4 relative">
        {/* Background Icon Watermark */}
        <div className="absolute opacity-5 text-9xl select-none pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
           {isAnalyzing ? "⚙️" : icon}
        </div>

        <div className="text-5xl mb-3 filter drop-shadow-md z-10 transition-all duration-300 transform group-hover:-translate-y-1">
            {isAnalyzing ? "🤔" : icon}
        </div>
        
        <h2 className={`text-xl md:text-2xl font-bold uppercase tracking-wider ${textColor} z-10`}>
          {isAnalyzing ? "Analisando..." : result?.message}
        </h2>
        
        {!isAnalyzing && result?.description && (
          <p className="text-slate-400 text-xs max-w-xs mx-auto mt-2 font-mono bg-slate-900/40 px-3 py-1 rounded-full border border-white/5 truncate z-10">
            {result.description}
          </p>
        )}

        {!isAnalyzing && result?.confidence !== undefined && (
           <div className="absolute top-3 right-3 z-10">
             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confiança</div>
             <div className={`text-lg font-mono font-bold ${result.confidence > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
               {result.confidence}%
             </div>
           </div>
        )}

        {result?.timestamp && (
           <p className="text-[10px] text-slate-600 absolute bottom-2 right-4 font-mono z-10">
             {new Date(result.timestamp).toLocaleTimeString()}
           </p>
        )}
      </div>
    </div>
  );
};