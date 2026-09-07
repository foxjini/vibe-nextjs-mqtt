'use client';

import React, { useEffect, useState } from 'react';
import { ConnectionStatus } from '@/types/mqtt';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Settings2, 
  Activity, 
  Sparkles,
  RefreshCw,
  Power
} from 'lucide-react';

interface HeaderProps {
  status: ConnectionStatus;
  isAudioUnlocked: boolean;
  isSpeaking: boolean;
  onUnlockAudio: () => void;
  onOpenBrokerConfig: () => void;
  onToggleConnect: () => void;
  activeTopic: string;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isAudioUnlocked,
  isSpeaking,
  onUnlockAudio,
  onOpenBrokerConfig,
  onToggleConnect,
  activeTopic,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('ko-KR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold glow-emerald">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>MQTT 연결됨</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>브로커 접속 중...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold glow-rose">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>통신 오류</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span>연결 끊김</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-violet-600 text-white shadow-lg glow-cyan">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider text-white flex items-center gap-2">
                VIBE MQTT <span className="text-cyan-400 text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">2026 EDITION</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>실시간 MQTT 교통 관제 한국어 음성 안내 시스템 (iot/traffic)</span>
            </p>
          </div>
        </div>

        {/* Center: Live clock & Subscribed Topic */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-xs">
          <span className="text-slate-400 font-mono">구독 토픽:</span>
          <span className="text-cyan-300 font-mono font-medium px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50">
            {activeTopic || '없음'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">현재 시각:</span>
          <span className="text-emerald-400 font-mono font-bold tracking-widest">{timeString}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Audio Enable / Status Button */}
          <button
            onClick={onUnlockAudio}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              isAudioUnlocked
                ? isSpeaking
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/60 text-rose-300 animate-bounce'
            }`}
            title={isAudioUnlocked ? '오디오가 활성화되어 음성이 출력됩니다.' : '클릭하여 Chrome 오디오 출력을 활성화하세요.'}
          >
            {isAudioUnlocked ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>{isSpeaking ? '음성 출력 중...' : '오디오 활성화됨'}</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>오디오 켜기 (클릭)</span>
              </>
            )}
          </button>

          {/* MQTT Status Indicator */}
          {getStatusBadge()}

          {/* Connect / Disconnect Toggle Button */}
          <button
            onClick={onToggleConnect}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              status === 'connected'
                ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            }`}
            title={status === 'connected' ? 'MQTT 연결 끊기' : 'MQTT 브로커 연결하기'}
          >
            <Power className="w-4 h-4" />
          </button>

          {/* Broker Settings Modal Trigger */}
          <button
            onClick={onOpenBrokerConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="브로커 및 연결 설정"
          >
            <Settings2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">설정</span>
          </button>
        </div>
      </div>
    </header>
  );
};
