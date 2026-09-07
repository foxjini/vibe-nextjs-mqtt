'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  BrokerConfig, 
  ConnectionStatus, 
  MQTTMessage, 
  VoiceRule, 
  VoiceLog, 
  VoiceTone 
} from '@/types/mqtt';
import { mqttService, DEFAULT_BROKER_CONFIG } from '@/lib/mqttClient';
import { ttsEngine } from '@/lib/ttsEngine';
import { DEFAULT_RULES, evaluateRuleMatch, formatSpeechText } from '@/lib/ruleMatcher';
import { Header } from '@/components/Header';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { StatCards } from '@/components/StatCards';
import { RuleManager } from '@/components/RuleManager';
import { MessageFeed } from '@/components/MessageFeed';
import { VoiceHistory } from '@/components/VoiceHistory';
import { BrokerModal } from '@/components/BrokerModal';
import { Sparkles, Terminal } from 'lucide-react';

export default function Home() {
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>(DEFAULT_BROKER_CONFIG);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [rules, setRules] = useState<VoiceRule[]>(DEFAULT_RULES);
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);

  // TTS states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);

  // Keep latest rules ref for message callback
  const rulesRef = useRef<VoiceRule[]>(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  // Unlock audio handler for Chrome autoplay policy
  const handleUnlockAudio = useCallback(async () => {
    try {
      await ttsEngine.unlockAudio();
      setIsAudioUnlocked(true);
      await ttsEngine.speak('교통 관제 음성 시스템이 준비되었습니다.', {
        pitch: 1.0,
        rate: 1.0,
      });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Audio unlock error:', err);
    }
  }, []);

  // Process incoming MQTT message
  const handleIncomingMessage = useCallback((msg: MQTTMessage) => {
    setMessages((prev) => [msg, ...prev.slice(0, 99)]);

    // Check rules
    const currentRules = rulesRef.current;
    for (const rule of currentRules) {
      if (evaluateRuleMatch(rule, msg.topic, msg.payload)) {
        msg.matchedRuleId = rule.id;
        const formattedSpeech = formatSpeechText(rule.speechText, msg.topic, msg.payload);

        // Trigger TTS voice with natural pitch 1.0 and rate 1.0
        ttsEngine.speak(formattedSpeech, {
          tone: rule.tone,
          pitch: 1.0,
          rate: 1.0,
        });

        // Add to voice logs
        const newVoiceLog: VoiceLog = {
          id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: Date.now(),
          speechText: formattedSpeech,
          ruleName: rule.name,
          topic: msg.topic,
          payload: msg.payload,
          tone: rule.tone,
        };

        setVoiceLogs((prev) => [newVoiceLog, ...prev.slice(0, 49)]);
        break; // Match first matching enabled rule
      }
    }
  }, []);

  // Initialize and load saved configs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load saved broker config
    const savedConfig = localStorage.getItem('vibe_mqtt_config');
    let initialConfig = DEFAULT_BROKER_CONFIG;
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Ensure topic is iot/traffic if previously set to wildcard
        if (!parsed.topic || parsed.topic === 'iot/#') {
          parsed.topic = 'iot/traffic';
        }
        initialConfig = parsed;
        setBrokerConfig(initialConfig);
      } catch {
        // ignore
      }
    }

    // Load saved rules - if old demo rules exist, switch to default traffic rules
    const savedRules = localStorage.getItem('vibe_mqtt_rules');
    if (savedRules) {
      try {
        const parsedRules: VoiceRule[] = JSON.parse(savedRules);
        const hasTrafficRules = parsedRules.some((r) => r.id.startsWith('traffic-'));
        if (hasTrafficRules) {
          setRules(parsedRules);
        } else {
          setRules(DEFAULT_RULES);
          localStorage.setItem('vibe_mqtt_rules', JSON.stringify(DEFAULT_RULES));
        }
      } catch {
        setRules(DEFAULT_RULES);
      }
    } else {
      setRules(DEFAULT_RULES);
      localStorage.setItem('vibe_mqtt_rules', JSON.stringify(DEFAULT_RULES));
    }

    // TTS listeners
    const unsubSpeaking = ttsEngine.subscribeSpeakingState((speaking, text) => {
      setIsSpeaking(speaking);
      setCurrentSpeechText(text);
    });

    const unsubVoices = ttsEngine.subscribeVoices((voices) => {
      const selected = ttsEngine.getSelectedVoice();
      if (selected) {
        setSelectedVoiceName(selected.name);
      } else if (voices.length > 0) {
        setSelectedVoiceName(voices[0].name);
      }
    });

    // MQTT listeners
    const unsubStatus = mqttService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubMsg = mqttService.onMessage((msg) => {
      handleIncomingMessage(msg);
    });

    // Connect to broker
    mqttService.connect(initialConfig).catch((err) => {
      console.warn('Initial connection attempt:', err);
    });

    return () => {
      unsubSpeaking();
      unsubVoices();
      unsubStatus();
      unsubMsg();
    };
  }, [handleIncomingMessage]);

  // Save rules to localStorage
  const handleUpdateRules = (newRules: VoiceRule[]) => {
    setRules(newRules);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_mqtt_rules', JSON.stringify(newRules));
    }
  };

  const handleResetDefaultRules = () => {
    if (confirm('교통 관제 음성 규칙을 기본 예제로 복원하시겠습니까?')) {
      handleUpdateRules(DEFAULT_RULES);
    }
  };

  // Preview / Test speech directly with default 1.0 pitch and rate
  const handlePreviewSpeech = (
    text: string,
    tone: VoiceTone = 'cheerful'
  ) => {
    if (!isAudioUnlocked) {
      setIsAudioUnlocked(true);
    }
    ttsEngine.speak(text, { tone, pitch: 1.0, rate: 1.0 });
  };

  // Connect / Disconnect toggle
  const handleToggleConnect = () => {
    if (status === 'connected' || status === 'connecting') {
      mqttService.disconnect();
    } else {
      mqttService.connect(brokerConfig);
    }
  };

  // Save broker config
  const handleSaveBrokerConfig = (newConfig: BrokerConfig) => {
    setBrokerConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_mqtt_config', JSON.stringify(newConfig));
    }
    mqttService.connect(newConfig);
  };

  // Replay past voice log
  const handleReplayVoiceLog = (log: VoiceLog) => {
    if (!isAudioUnlocked) setIsAudioUnlocked(true);
    ttsEngine.speak(log.speechText, { tone: log.tone, pitch: 1.0, rate: 1.0 });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <Header
        status={status}
        isAudioUnlocked={isAudioUnlocked}
        isSpeaking={isSpeaking}
        onUnlockAudio={handleUnlockAudio}
        onOpenBrokerConfig={() => setIsBrokerModalOpen(true)}
        onToggleConnect={handleToggleConnect}
        activeTopic={brokerConfig.topic}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Section 1: Audio Visualizer & Ready Banner */}
        <VoiceVisualizer
          isSpeaking={isSpeaking}
          currentText={currentSpeechText}
          selectedVoiceName={selectedVoiceName}
          onTestSpeech={() =>
            handlePreviewSpeech(
              '현재 교통 상황이 정상 입니다.',
              'cheerful'
            )
          }
          isAudioUnlocked={isAudioUnlocked}
          onUnlockAudio={handleUnlockAudio}
        />

        {/* Section 2: Real-time Stat Cards */}
        <StatCards
          status={status}
          brokerHost={brokerConfig.brokerUrl}
          totalMessages={messages.length}
          totalVoiceOutputs={voiceLogs.length}
          activeRulesCount={rules.filter((r) => r.enabled).length}
          totalRulesCount={rules.length}
        />

        {/* Section 3: Traffic Voice Rules Manager (Full Width Focus) */}
        <div>
          <RuleManager
            rules={rules}
            onUpdateRules={handleUpdateRules}
            onPreviewSpeech={handlePreviewSpeech}
            onResetDefaultRules={handleResetDefaultRules}
          />
        </div>

        {/* Section 4: Dual Grid (Live Message Feed & Voice History) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <MessageFeed messages={messages} onClear={() => setMessages([])} />
          </div>
          <div className="lg:col-span-6">
            <VoiceHistory
              logs={voiceLogs}
              onReplay={handleReplayVoiceLog}
              onClear={() => setVoiceLogs([])}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span>VIBE Next.js MQTT Traffic Voice System &copy; 2026</span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          단일 토픽(iot/traffic) &bull; 한국어 자연 음성 (피치 1.0x / 속도 1.0x)
        </span>
      </footer>

      {/* Broker Configuration Modal */}
      <BrokerModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        config={brokerConfig}
        onSave={handleSaveBrokerConfig}
      />
    </div>
  );
}
