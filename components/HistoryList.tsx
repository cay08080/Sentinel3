import React from 'react';
import { AnalysisResult, DetectionStatus } from '../types';

interface HistoryListProps {
  history: AnalysisResult[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  if (history.length === 0) return null;

  const getStatusStyle = (status: DetectionStatus) => {
    switch (status) {
      case DetectionStatus.PERSON_DETECTED:
        return { border: 'border-yellow-500/50', text: 'text-yellow-400', bg: 'bg-yellow-500/5', icon: '⚠️' };
      case DetectionStatus.NO_PERSON:
        return { border: 'border-green-500/50', text: 'text-green-400', bg: 'bg-green-500/5', icon: '✅' };
      case DetectionStatus.STATIC_SCENE:
        return { border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/5', icon: '💤' };
      case DetectionStatus.ERROR:
        return { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500/5', icon: '🛑' };
      default:
        return { border: 'border-slate-600', text: 'text-slate-400', bg: 'bg-slate-800', icon: '❓' };
    }
  };

  return (
    <div className="w-full mt-6 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Histórico de Eventos</h3>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">ÚLTIMOS 5</span>
      </div>
      
      <div className="divide-y divide-slate-800/50">
        {history.map((item, index) => {
          const style = getStatusStyle(item.status);
          return (
            <div 
              key={item.timestamp} 
              className={`p-3 flex items-center gap-3 transition-colors hover:bg-slate-800/30 ${index === 0 ? 'bg-slate-800/20' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${style.border} ${style.bg} text-lg`}>
                {style.icon}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className={`text-xs font-bold ${style.text} truncate`}>
                    {item.message}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-2">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {item.description && (
                  <p className="text-[11px] text-slate-400 truncate opacity-80">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};