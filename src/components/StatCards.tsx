'use client';

import React from 'react';
import { Radio, MessageSquare, Volume2, ShieldCheck } from 'lucide-react';
import { ConnectionStatus } from '@/types/mqtt';

interface StatCardsProps {
  status: ConnectionStatus;
  brokerHost: string;
  totalMessages: number;
  totalVoiceOutputs: number;
  activeRulesCount: number;
  totalRulesCount: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  status,
  brokerHost,
  totalMessages,
  totalVoiceOutputs,
  activeRulesCount,
  totalRulesCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Broker Connection */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">브로커 통신 상태</span>
          <div className={`p-2 rounded-xl ${
            status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            {status === 'connected' ? (
              <span className="text-emerald-400">정상 통신 중</span>
            ) : status === 'connecting' ? (
              <span className="text-amber-400">접속 시도 중</span>
            ) : status === 'error' ? (
              <span className="text-rose-400">오류 발생</span>
            ) : (
              <span className="text-slate-400">연결 대기</span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate mt-1 font-mono" title={brokerHost}>
            {brokerHost || '미설정'}
          </p>
        </div>
      </div>

      {/* 2. Received Messages Count */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">수신 메시지 누적</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {totalMessages.toLocaleString()}
            <span className="text-xs font-sans font-normal text-slate-400 ml-1.5">건</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">실시간 토픽 이벤트 감지</p>
        </div>
      </div>

      {/* 3. Spoken Voice Count */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">한국어 음성 송출</span>
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
            <Volume2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-mono text-violet-300">
            {totalVoiceOutputs.toLocaleString()}
            <span className="text-xs font-sans font-normal text-slate-400 ml-1.5">회 발화</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">교통 상황 TTS 안내 트리거</p>
        </div>
      </div>

      {/* 4. Active Rules Count */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">음성 매핑 규칙</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-mono text-amber-300">
            {activeRulesCount}
            <span className="text-xs font-sans font-normal text-slate-400 ml-1.5">
              / {totalRulesCount}개 활성
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">단어 및 조건 감응형 룰</p>
        </div>
      </div>
    </div>
  );
};
