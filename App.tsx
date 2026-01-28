import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WebcamCapture, WebcamCaptureRef } from './components/WebcamCapture';
import { StatusPanel } from './components/StatusPanel';
import { HistoryList } from './components/HistoryList';
import { analyzeImageForPerson } from './services/geminiService';
import { AnalysisResult, DetectionStatus } from './types';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [sensitivity, setSensitivity] = useState(70);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const webcamRef = useRef<WebcamCaptureRef>(null);

  const isApiKeyMissing = !process.env.API_KEY || process.env.API_KEY === "undefined" || process.env.API_KEY === "";

  // Alarme Sonoro Aprimorado
  const playAlarm = useCallback(async () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Tonalidade de Sirene
      playTone(440, 0, 0.4);
      playTone(880, 0.4, 0.4);
      playTone(440, 0.8, 0.4);
    } catch (e) {
      console.warn("Áudio bloqueado", e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    let itv: any;
    if (isActive) {
      itv = setInterval(() => {
        setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
      }, 1000);
    } else {
      setCountdown(30);
    }
    return () => clearInterval(itv);
  }, [isActive]);

  const handleCapture = async (img: string) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setCountdown(30);

    try {
      const res = await analyzeImageForPerson(img);
      setLastResult(res);
      setHistory(prev => [res, ...prev].slice(0, 10));
      
      if (res.status === DetectionStatus.PERSON_DETECTED) {
        await playAlarm();
      }
    } catch (e: any) {
      const errRes: AnalysisResult = {
        status: DetectionStatus.ERROR,
        message: "FALHA NA ANÁLISE",
        description: "Erro ao conectar com a IA.",
        timestamp: Date.now()
      };
      setLastResult(errRes);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 transition-colors duration-500 ${lastResult?.status === DetectionStatus.PERSON_DETECTED ? 'bg-red-950/20' : ''}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {isApiKeyMissing && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-pulse">
            <span>⚠️</span>
            <p><strong>Configuração Pendente:</strong> API_KEY não encontrada no ambiente.</p>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">SENTINEL <span className="text-blue-500">AI</span></h1>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">Monitoramento de Perímetro</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-xl border transition-all ${soundEnabled ? 'border-slate-700 bg-slate-800' : 'border-red-900/50 bg-red-950/30 text-red-500'}`}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button
              onClick={() => setIsActive(!isActive)}
              disabled={isApiKeyMissing}
              className={`px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all ${
                isActive ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-blue-600 text-white'
              } disabled:opacity-30`}
            >
              {isActive ? 'DESATIVAR ALARME' : 'ATIVAR MONITOR'}
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7 space-y-6">
            <div className={`p-1 rounded-3xl border transition-all duration-700 ${lastResult?.status === DetectionStatus.PERSON_DETECTED ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-slate-800 bg-slate-900/50'}`}>
              <WebcamCapture 
                ref={webcamRef}
                isActive={isActive}
                onCapture={handleCapture}
                onNoMotion={() => {
                  if (lastResult?.status !== DetectionStatus.PERSON_DETECTED) {
                    setLastResult({ status: DetectionStatus.STATIC_SCENE, message: "ÁREA SEGURA", description: "Nenhuma movimentação detectada.", timestamp: Date.now() });
                  }
                }}
                intervalMs={30000}
                sensitivity={sensitivity}
                width={1280}
                height={720}
              />
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sensibilidade do Sensor</label>
                <span className="text-blue-400 font-mono text-xs">{sensitivity}%</span>
              </div>
              <input 
                type="range" min="1" max="100" value={sensitivity} 
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Check-in de IA em</span>
              <span className={`text-2xl font-black font-mono ${isActive ? 'text-blue-500' : 'text-slate-700'}`}>{isActive ? countdown : '--'}s</span>
            </div>
            <StatusPanel result={lastResult} isAnalyzing={isAnalyzing} />
            <HistoryList history={history} />
          </aside>
        </main>
      </div>

      {lastResult?.status === DetectionStatus.PERSON_DETECTED && (
        <div className="fixed inset-0 pointer-events-none border-[20px] border-red-600/30 animate-pulse z-50"></div>
      )}
    </div>
  );
};

export default App;