'use client';

import React, { useMemo } from 'react';
import { Volume2, Sparkles, Mic, Play } from 'lucide-react';

interface VoiceVisualizerProps {
  isSpeaking: boolean;
  currentText: string;
  selectedVoiceName: string | null;
  onTestSpeech: () => void;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isSpeaking,
  currentText,
  selectedVoiceName,
  onTestSpeech,
  isAudioUnlocked,
  onUnlockAudio,
}) => {
  // Generate random heights/delays for 28 animated frequency bars
  const barConfig = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      delay: (i * 0.04).toFixed(2),
      duration: (0.4 + (i % 5) * 0.15).toFixed(2),
      maxHeight: 18 + ((i * 7) % 24),
    }));
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-panel p-5 transition-all duration-500 ${
      isSpeaking ? 'border-cyan-500/50 glow-cyan' : 'border-slate-800/80'
    }`}>
      {/* Background neon ambient light */}
      <div 
        className={`absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isSpeaking 
            ? 'bg-cyan-500/20 opacity-100' 
            : 'bg-blue-600/10 opacity-40'
        }`} 
      />
      <div 
        className={`absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isSpeaking 
            ? 'bg-violet-500/20 opacity-100' 
            : 'bg-violet-900/10 opacity-30'
        }`} 
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Speaker Status Info */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
            isSpeaking 
              ? 'bg-gradient-to-tr from-cyan-500 to-violet-500 text-white shadow-xl glow-cyan scale-105' 
              : 'bg-slate-800/90 border border-slate-700/80 text-slate-400'
          }`}>
            {isSpeaking ? (
              <Volume2 className="w-7 h-7 animate-bounce" />
            ) : (
              <Mic className="w-7 h-7" />
            )}

            {/* Ripple ring animation when speaking */}
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-2xl border-2 border-cyan-400/60 animate-ping" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI 음성 엔진 상태
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                한국어 기본 음성 (피치 1.0x / 속도 1.0x)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                음성: {selectedVoiceName || 'Google 한국어'}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <span className={`text-sm font-semibold transition-colors ${
                isSpeaking ? 'text-cyan-300' : 'text-slate-300'
              }`}>
                {isSpeaking ? (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    발화 중: &ldquo;{currentText}&rdquo;
                  </span>
                ) : (
                  'MQTT 메시지 수신 대기 중 (지정 토픽 수신 시 자동 음성 송출)'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Dynamic Audio Waveform Equalizer */}
        <div className="flex items-end justify-center gap-1 h-12 px-6 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 w-full md:w-auto">
          {barConfig.map((bar) => {
            const height = isSpeaking ? `${bar.maxHeight}px` : '4px';
            return (
              <div
                key={bar.id}
                className={`w-1 rounded-full transition-all ${
                  isSpeaking
                    ? 'bg-gradient-to-t from-cyan-500 via-teal-400 to-violet-400'
                    : 'bg-slate-700 opacity-50'
                }`}
                style={{
                  height,
                  animation: isSpeaking
                    ? `soundwave ${bar.duration}s ease-in-out infinite alternate ${bar.delay}s`
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {!isAudioUnlocked ? (
            <button
              onClick={onUnlockAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-lg glow-rose transition-all transform active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>오디오 권한 허용</span>
            </button>
          ) : (
            <button
              onClick={onTestSpeech}
              disabled={isSpeaking}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                isSpeaking
                  ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60 active:scale-95'
              }`}
              title="한국어 기본 톤으로 테스트 음성을 즉시 출력합니다."
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>한국어 테스트 발화</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
