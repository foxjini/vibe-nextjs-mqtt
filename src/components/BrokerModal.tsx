'use client';

import React, { useState } from 'react';
import { BrokerConfig } from '@/types/mqtt';
import { BROKER_PRESETS } from '@/lib/mqttClient';
import { 
  X, 
  Server, 
  Radio, 
  Check, 
  Key, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Monitor 
} from 'lucide-react';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BrokerConfig;
  onSave: (config: BrokerConfig) => void;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<BrokerConfig>(config);
  const [remoteIp, setRemoteIp] = useState<string>('');
  const [showConfigGuide, setShowConfigGuide] = useState<boolean>(false);
  const [copiedGuide, setCopiedGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: BrokerConfig) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      brokerUrl: preset.brokerUrl,
      cleanSession: preset.cleanSession,
      keepalive: preset.keepalive,
    }));
  };

  const handleApplyRemoteIp = () => {
    if (!remoteIp.trim()) return;
    const cleanIp = remoteIp.trim().replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
    const formattedUrl = `ws://${cleanIp}:9001`;
    setFormData((prev) => ({
      ...prev,
      name: `원격 Mosquitto (${cleanIp})`,
      brokerUrl: formattedUrl,
    }));
  };

  const configSnippet = `# mosquitto.conf 설정 추가
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true`;

  const handleCopyGuide = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">MQTT 브로커 통신 설정</h3>
              <p className="text-xs text-slate-400">다른 윈도 PC 또는 공용 브로커(WebSocket) 연결을 설정합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 flex-1 mt-4">
          {/* Guide Accordion for Remote Windows PC Mosquitto */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/60 border border-amber-500/30 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors"
            >
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>다른 윈도 PC의 Mosquitto 브로커 연결 시 필수 확인사항</span>
              </div>
              {showConfigGuide ? (
                <ChevronUp className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {showConfigGuide && (
              <div className="px-4 pb-4 pt-1 space-y-2.5 text-slate-300 border-t border-amber-500/20">
                <p className="leading-relaxed">
                  브라우저(Chrome)는 보안상 TCP(1883) 직접 접속이 불가하므로, 
                  <strong> 웹소켓(WebSocket, 기본 9001 포트)</strong>을 통해 브로커에 접속해야 합니다.
                </p>
                <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-amber-400 font-semibold text-[11px]">
                      브로커 PC의 mosquitto.conf 설정 (필수 추가)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyGuide}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedGuide ? '복사됨!' : '설정 복사'}</span>
                    </button>
                  </div>
                  <pre className="text-slate-300 font-mono text-[11px] leading-relaxed select-all">
                    {configSnippet}
                  </pre>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>설정 변경 후 브로커 PC에서 <strong>Mosquitto 서비스를 재시작</strong>해야 적용됩니다.</li>
                  <li>브로커 PC의 <strong>Windows Defender 방화벽</strong>에서 <strong>포트 9001 (TCP)</strong> 인바운드를 허용해야 합니다.</li>
                  <li>동일 공유기(LAN) 내인 경우 브로커 PC의 내부 IP(예: <code className="text-cyan-300">192.168.0.x</code>)를 사용하세요.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Quick Remote IP Helper Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                원격 윈도 PC Mosquitto IP 바로 입력
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remoteIp}
                  onChange={(e) => setRemoteIp(e.target.value)}
                  placeholder="예: 192.168.0.50 (또는 컴퓨터 IP)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleApplyRemoteIp}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all shrink-0"
                >
                  주소 생성
                </button>
              </div>
              <span className="text-[11px] text-slate-500 block">
                * IP를 입력하고 [주소 생성]을 누르면 아래 주소가 <code className="text-cyan-400">ws://IP:9001</code>로 자동 설정됩니다.
              </span>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                브로커 프리셋 선택 (Presets)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BROKER_PRESETS.map((p) => {
                  const isSelected = formData.brokerUrl === p.brokerUrl;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Broker URL */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                브로커 WebSocket 주소 (WSS / WS URL)
              </label>
              <input
                type="text"
                value={formData.brokerUrl}
                onChange={(e) => setFormData({ ...formData, brokerUrl: e.target.value })}
                placeholder="ws://192.168.0.50:9001"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                * 다른 윈도 PC의 경우 형식: <code className="text-slate-400">ws://&lt;PC_IP_주소&gt;:9001</code>
              </span>
            </div>

            {/* Subscription Topic */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                구독(Subscribe) 대상 토픽
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="iot/#"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                * 와일드카드(`<code className="text-cyan-400">#</code>`, `<code className="text-cyan-400">+</code>`) 사용 가능 (예: <code className="text-slate-400">iot/#</code>, <code className="text-slate-400">sensor/+/alert</code>)
              </span>
            </div>

            {/* Client ID & KeepAlive */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Client ID</label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="자동 생성됨"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">KeepAlive (초)</label>
                <input
                  type="number"
                  value={formData.keepalive}
                  onChange={(e) => setFormData({ ...formData, keepalive: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Authentication (Optional) */}
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>선택 인증 정보 (Mosquitto에 계정이 설정된 경우 입력)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="사용자명 (Username)"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                />
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="비밀번호 (Password)"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg glow-cyan transition-all"
              >
                저장 및 재연결
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
