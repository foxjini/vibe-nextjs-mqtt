'use client';

import React, { useState } from 'react';
import { MQTTMessage } from '@/types/mqtt';
import { MessageSquare, Trash2, Search, Radio, Sparkles, Copy, Check } from 'lucide-react';

interface MessageFeedProps {
  messages: MQTTMessage[];
  onClear: () => void;
}

export const MessageFeed: React.FC<MessageFeedProps> = ({ messages, onClear }) => {
  const [filter, setFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMessages = messages.filter(
    (m) =>
      m.topic.toLowerCase().includes(filter.toLowerCase()) ||
      m.payload.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              실시간 MQTT 수신 피드
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono">
                {messages.length}건
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              구독 토픽으로부터 실시간 도착한 MQTT 패킷 스트림입니다.
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={messages.length === 0}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="메시지 목록 비우기"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Filter bar */}
      <div className="mt-3 relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="토픽 또는 페이로드 검색..."
          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500"
        />
      </div>

      {/* Message List */}
      <div className="mt-3 space-y-2 overflow-y-auto max-h-[380px] pr-1 flex-1">
        {filteredMessages.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Radio className="w-6 h-6 text-slate-600 animate-pulse" />
            <span>수신된 메시지가 아직 없습니다. 브로커에 메시지를 발행해보세요.</span>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-cyan-400 font-semibold truncate">
                      {msg.topic}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      QoS {msg.qos}
                    </span>
                    {msg.matchedRuleId && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-semibold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                        음성 트리거됨
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-slate-400">{timeStr}</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.payload)}
                      className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                      title="페이로드 복사"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-2 p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 break-all border border-slate-900">
                  {msg.payload}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
