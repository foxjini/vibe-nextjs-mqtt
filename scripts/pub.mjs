/**
 * PowerShell에서 간편하게 MQTT 교통 메시지를 전송하는 CLI 도구
 * 사용법: node scripts/pub.mjs <IP> <메시지>
 * 예: node scripts/pub.mjs 192.168.0.50 normal
 * 지원 메시지: normal | warning | critical | emergency | restore
 */
import mqtt from 'mqtt';

const args = process.argv.slice(2);
const brokerIp = args[0] || 'localhost';
// 기본 토픽은 iot/traffic
const topic = 'iot/traffic';
const message = args[1] || 'normal';

// 일반 TCP(1883) 또는 웹소켓(9001) 지원
const brokerUrl = brokerIp.startsWith('mqtt://') || brokerIp.startsWith('ws://') 
  ? brokerIp 
  : `mqtt://${brokerIp}:1883`;

console.log(`========================================`);
console.log(`[MQTT 교통 관제 CLI] 브로커 연결: ${brokerUrl}`);
console.log(`[MQTT 교통 관제 CLI] 토픽: ${topic}`);
console.log(`[MQTT 교통 관제 CLI] 메시지: ${message}`);
console.log(`========================================`);

const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('[MQTT CLI] 브로커 연결 성공! 메시지 전송 중...');
  client.publish(topic, message, { qos: 0 }, (err) => {
    if (err) {
      console.error('[MQTT CLI] 전송 실패:', err);
    } else {
      console.log(`[MQTT CLI] 메시지 "${message}" 전송 완료! -> 웹 브라우저에서 한국어 음성이 출력됩니다.`);
    }
    client.end();
  });
});

client.on('error', (err) => {
  console.error('[MQTT CLI] 연결 에러:', err.message);
  client.end();
});
