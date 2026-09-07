import { VoiceRule } from '@/types/mqtt';

export const DEFAULT_RULES: VoiceRule[] = [
  {
    id: 'traffic-normal',
    name: '교통 정상',
    enabled: true,
    topicPattern: 'iot/traffic',
    conditionType: 'contains',
    conditionValue: 'normal',
    speechText: '현재 교통 상황이 정상 입니다.',
    tone: 'cheerful',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'traffic-warning',
    name: '교통 혼잡 주의',
    enabled: true,
    topicPattern: 'iot/traffic',
    conditionType: 'contains',
    conditionValue: 'warning',
    speechText: '현재 교통 상황이 혼잡하오니 주의 하시기 바랍니다.',
    tone: 'cheerful',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'traffic-critical',
    name: '교통 위험 우회',
    enabled: true,
    topicPattern: 'iot/traffic',
    conditionType: 'contains',
    conditionValue: 'critical',
    speechText: '현재 교통 상황이 위험하오니 우회 하시기 바랍니다.',
    tone: 'alert',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'traffic-emergency',
    name: '응급 상황 대피',
    enabled: true,
    topicPattern: 'iot/traffic',
    conditionType: 'contains',
    conditionValue: 'emergency',
    speechText: '현재 응급 상황이 발생하였으니 빨리 대피 하시기 바랍니다.',
    tone: 'alert',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'traffic-restore',
    name: '교통 흐름 회복',
    enabled: true,
    topicPattern: 'iot/traffic',
    conditionType: 'contains',
    conditionValue: 'restore',
    speechText: '현재 교통 흐름이 정상으로 회복 되었습니다.',
    tone: 'cheerful',
    pitch: 1.0,
    rate: 1.0,
  },
];

/**
 * Checks if a published MQTT topic matches a subscription/pattern with + and #
 */
export function matchMQTTTopic(pattern: string, topic: string): boolean {
  if (!pattern || pattern === '#' || pattern === '') return true;
  if (pattern === topic) return true;

  const patternSegments = pattern.split('/');
  const topicSegments = topic.split('/');

  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const t = topicSegments[i];

    if (p === '#') {
      return true; // '#' matches rest of the topic
    }
    if (p === '+') {
      if (t === undefined) return false;
      continue; // '+' matches single segment
    }
    if (p !== t) {
      return false;
    }
  }

  return patternSegments.length === topicSegments.length;
}

/**
 * Evaluates whether an incoming message matches the given rule
 */
export function evaluateRuleMatch(rule: VoiceRule, topic: string, payload: string): boolean {
  if (!rule.enabled) return false;

  // 1. Check topic
  if (rule.topicPattern && !matchMQTTTopic(rule.topicPattern, topic)) {
    return false;
  }

  const rawPayload = payload.trim();
  const lowerPayload = rawPayload.toLowerCase();
  const condVal = rule.conditionValue.trim();

  // 2. Check condition type
  switch (rule.conditionType) {
    case 'contains':
      return lowerPayload.includes(condVal.toLowerCase());

    case 'exact':
      return lowerPayload === condVal.toLowerCase();

    case 'regex':
      try {
        const re = new RegExp(condVal, 'i');
        return re.test(rawPayload);
      } catch {
        return false;
      }

    case 'json_key':
      try {
        const parsed = JSON.parse(rawPayload);
        // format: "key=value" or just "key"
        if (condVal.includes('=')) {
          const [k, v] = condVal.split('=').map(s => s.trim());
          return String(parsed[k]) === v;
        } else if (condVal.includes(':')) {
          const [k, v] = condVal.split(':').map(s => s.trim());
          return String(parsed[k]) === v;
        } else {
          return parsed[condVal] !== undefined;
        }
      } catch {
        return false;
      }

    case 'dynamic':
      return rawPayload.length > 0;

    default:
      return false;
  }
}

/**
 * Format speech template with payload or context variables
 */
export function formatSpeechText(template: string, topic: string, payload: string): string {
  let text = template;
  text = text.replace(/\{payload\}/gi, payload);
  text = text.replace(/\{topic\}/gi, topic);

  // If payload is JSON, allow {json.key} replacement
  if (text.includes('{json.')) {
    try {
      const parsed = JSON.parse(payload);
      text = text.replace(/\{json\.([a-zA-Z0-9_-]+)\}/gi, (_, key) => {
        return parsed[key] !== undefined ? String(parsed[key]) : '';
      });
    } catch {
      // ignore json parse error
    }
  }

  return text;
}
