export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export type ConditionType = 'contains' | 'exact' | 'regex' | 'json_key' | 'dynamic';

export type VoiceTone = 'cheerful' | 'alert' | 'calm';

export interface BrokerConfig {
  name: string;
  brokerUrl: string; // e.g. wss://broker.emqx.io:8084/mqtt
  clientId: string;
  topic: string;
  username?: string;
  password?: string;
  cleanSession: boolean;
  keepalive: number;
}

export interface VoiceRule {
  id: string;
  name: string;
  enabled: boolean;
  topicPattern: string; // e.g. "iot/sensor/#" or "iot/voice/alert"
  conditionType: ConditionType;
  conditionValue: string; // e.g. "welcome", "fire", "temp>30"
  speechText: string; // Text to speak, e.g. "반갑습니다! 어서오세요."
  tone: VoiceTone;
  pitch: number; // e.g. 1.25 for cheerful
  rate: number; // e.g. 1.10 for cheerful
}

export interface MQTTMessage {
  id: string;
  topic: string;
  payload: string;
  timestamp: number;
  qos: number;
  retain: boolean;
  matchedRuleId?: string;
}

export interface VoiceLog {
  id: string;
  timestamp: number;
  speechText: string;
  ruleName: string;
  topic: string;
  payload: string;
  tone: VoiceTone;
  durationMs?: number;
}

export interface TTSState {
  isSpeaking: boolean;
  isAudioUnlocked: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  availableKoreanVoices: SpeechSynthesisVoice[];
  currentText: string;
}
