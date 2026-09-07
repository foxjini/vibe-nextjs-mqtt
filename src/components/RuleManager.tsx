'use client';

import React, { useState } from 'react';
import { VoiceRule, ConditionType, VoiceTone } from '@/types/mqtt';
import { 
  ShieldCheck, 
  Plus, 
  Volume2, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  RotateCcw,
  Sparkles,
  Sliders
} from 'lucide-react';

interface RuleManagerProps {
  rules: VoiceRule[];
  onUpdateRules: (newRules: VoiceRule[]) => void;
  onPreviewSpeech: (text: string, tone: VoiceTone, pitch: number, rate: number) => void;
  onResetDefaultRules: () => void;
}

export const RuleManager: React.FC<RuleManagerProps> = ({
  rules,
  onUpdateRules,
  onPreviewSpeech,
  onResetDefaultRules,
}) => {
  const [editingRule, setEditingRule] = useState<VoiceRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    onUpdateRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('이 음성 규칙을 삭제하시겠습니까?')) {
      const updated = rules.filter((r) => r.id !== id);
      onUpdateRules(updated);
    }
  };

  const handleOpenAdd = () => {
    setEditingRule({
      id: `rule-${Date.now()}`,
      name: '새 음성 안내 규칙',
      enabled: true,
      topicPattern: 'iot/sensor/#',
      conditionType: 'contains',
      conditionValue: '',
      speechText: '새로운 이벤트가 감지되었습니다.',
      tone: 'cheerful',
      pitch: 1.25,
      rate: 1.10,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: VoiceRule) => {
    setEditingRule({ ...rule });
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    const exists = rules.some((r) => r.id === editingRule.id);
    let updated: VoiceRule[];
    if (exists) {
      updated = rules.map((r) => (r.id === editingRule.id ? editingRule : r));
    } else {
      updated = [editingRule, ...rules];
    }
    onUpdateRules(updated);
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const getToneBadge = (tone: VoiceTone) => {
    switch (tone) {
      case 'cheerful':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            밝고 명랑한 톤
          </span>
        );
      case 'alert':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
            긴급 경보 톤
          </span>
        );
      case 'calm':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300 text-[11px] font-semibold">
            차분한 안내 톤
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
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              음성 매핑 규칙 엔진 (Voice Rule Engine)
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono">
                {rules.length}개 설정
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              수신된 MQTT 토픽 및 페이로드 값에 따라 한국어 음성 멘트를 자동 매칭합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaultRules}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs font-medium"
            title="기본 샘플 규칙으로 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>규칙 추가</span>
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="mt-3.5 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
        {rules.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            등록된 음성 규칙이 없습니다. [규칙 추가] 버튼을 눌러보세요.
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border transition-all ${
                rule.enabled
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-violet-500/40'
                  : 'bg-slate-950/40 border-slate-900/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{rule.name}</span>
                    {getToneBadge(rule.tone)}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      토픽: {rule.topicPattern || '*'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      조건: {rule.conditionType} [{rule.conditionValue}]
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-300 font-medium line-clamp-2">
                    &ldquo;{rule.speechText}&rdquo;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Preview audio */}
                  <button
                    onClick={() =>
                      onPreviewSpeech(rule.speechText, rule.tone, rule.pitch, rule.rate)
                    }
                    className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                    title="명랑 톤으로 미리듣기"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="규칙 편집"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Enable */}
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {rule.enabled ? 'ON' : 'OFF'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="규칙 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                음성 규칙 설정
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">규칙 명칭</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">대상 토픽 패턴</label>
                  <input
                    type="text"
                    value={editingRule.topicPattern}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, topicPattern: e.target.value })
                    }
                    placeholder="iot/sensor/#"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">조건 유형</label>
                  <select
                    value={editingRule.conditionType}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        conditionType: e.target.value as ConditionType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-violet-500"
                  >
                    <option value="contains">포함 (Contains)</option>
                    <option value="exact">일치 (Exact)</option>
                    <option value="regex">정규식 (Regex)</option>
                    <option value="json_key">JSON 키 매칭</option>
                    <option value="dynamic">동적 전체 수신 (Dynamic)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  조건 값 (Condition Value)
                </label>
                <input
                  type="text"
                  value={editingRule.conditionValue}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, conditionValue: e.target.value })
                  }
                  placeholder="예: welcome, fire, high, status:warning 등"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  출력 음성 멘트 (Speech Text)
                </label>
                <textarea
                  value={editingRule.speechText}
                  onChange={(e) => setEditingRule({ ...editingRule, speechText: e.target.value })}
                  rows={2}
                  required
                  placeholder="한국어로 출력할 음성 문장 ({payload} 변수 지원)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  * 멘트에 &lsquo;&#123;payload&#125;&rsquo;를 포함하면 수신된 메시지 원문이 그대로 낭독됩니다.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">음성 톤</label>
                  <select
                    value={editingRule.tone}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, tone: e.target.value as VoiceTone })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none"
                  >
                    <option value="cheerful">밝고 명랑한 톤</option>
                    <option value="alert">긴급 경보 톤</option>
                    <option value="calm">차분한 안내 톤</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">피치 (Pitch)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="2.0"
                    value={editingRule.pitch}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, pitch: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">속도 (Rate)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="2.0"
                    value={editingRule.rate}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, rate: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md"
                >
                  저장 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
