'use client';

import React from 'react';
import { VoiceLog, VoiceTone } from '@/types/mqtt';
import { Volume2, Play, Trash2, Clock, Sparkles } from 'lucide-react';

interface VoiceHistoryProps {
  logs: VoiceLog[];
  onReplay: (log: VoiceLog) => void;
  onClear: () => void;
}

export const VoiceHistory: React.FC<VoiceHistoryProps> = ({ logs, onReplay, onClear }) => {
  const getToneBadge = (tone: VoiceTone) => {
    switch (tone) {
      case 'cheerful':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            명랑 톤
          </span>
        );
      case 'alert':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">
            경보 톤
          </span>
        );
      case 'calm':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300 text-[10px] font-semibold">
            차분 톤
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              음성 송출 이력 (Speech Output Logs)
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono">
                {logs.length}회
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              규칙에 의해 크롬 브라우저에서 발화된 한국어 음성 목록입니다.
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={logs.length === 0}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="음성 이력 비우기"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Logs list */}
      <div className="mt-3.5 space-y-2 overflow-y-auto max-h-[380px] pr-1 flex-1">
        {logs.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Volume2 className="w-6 h-6 text-slate-600" />
            <span>아직 발화된 음성 이력이 없습니다.</span>
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString('ko-KR', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/40 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-semibold text-white truncate">{log.ruleName}</span>
                    {getToneBadge(log.tone)}
                    <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded">
                      {log.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {timeStr}
                    </span>
                    <button
                      onClick={() => onReplay(log)}
                      className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 transition-colors flex items-center gap-1"
                      title="이 음성 다시 듣기"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-medium">재생</span>
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-slate-200 font-medium">
                  &ldquo;{log.speechText}&rdquo;
                </p>

                {log.payload && (
                  <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
                    원문 페이로드: <span className="text-slate-300">{log.payload}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
