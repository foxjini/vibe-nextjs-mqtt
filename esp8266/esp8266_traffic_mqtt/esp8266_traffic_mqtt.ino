/**
 * ==============================================================================
 * 프로젝트: VIBE MQTT 2026 - ESP8266 교통 관제 음성 안내 연동 예제
 * 파일명: esp8266_traffic_mqtt.ino
 * 설명: ESP8266(NodeMCU / D1 mini 등)에서 Wi-Fi를 통해 윈도우 PC Mosquitto
 *       브로커(포트 1883)로 접속하여 'iot/traffic' 토픽으로 교통 상황 메시지를
 *       발행(Publish)합니다. 웹 대시보드(Next.js)에서 한국어 음성이 자동 출력됩니다.
 * 
 * [필요 라이브러리 - 아두이노 IDE 라이브러리 관리자에서 설치]
 * 1. ESP8266 보드 패키지
 * 2. PubSubClient by Nick O'Leary (v2.8 이상)
 * ==============================================================================
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// ==============================================================================
// 1. 네트워크 및 MQTT 브로커 설정 (학생 본인의 환경에 맞게 수정)
// ==============================================================================
const char* ssid        = "YOUR_WIFI_SSID";         // 학교 또는 가정의 Wi-Fi 이름
const char* password    = "YOUR_WIFI_PASSWORD";     // Wi-Fi 비밀번호

// Mosquitto 브로커가 설치된 윈도우 PC의 IP 주소 (예: 192.168.0.50)
const char* mqtt_server = "192.168.0.50";
const int   mqtt_port   = 1883;                     // 일반 MQTT 표준 포트 (1883)

// 관제 토픽
const char* topic_traffic = "iot/traffic";

// 버튼 핀 설정 (NodeMCU의 FLASH 버튼인 D3/GPIO0 사용, 다른 핀으로 변경 가능)
const int BUTTON_PIN = 0; // D3 (GPIO0)

// ==============================================================================
// 2. 전역 객체 및 변수
// ==============================================================================
WiFiClient espClient;
PubSubClient client(espClient);

// 5가지 교통 상태 시나리오 배열
const char* trafficStates[] = {
  "normal",      // 현재 교통 상황이 정상 입니다.
  "warning",     // 현재 교통 상황이 혼잡하오니 주의 하시기 바랍니다.
  "critical",    // 현재 교통 상황이 위험하오니 우회 하시기 바랍니다.
  "emergency",   // 현재 응급 상황이 발생하였으니 빨리 대피 하시기 바랍니다.
  "restore"      // 현재 교통 흐름이 정상으로 회복 되었습니다.
};
const int TOTAL_STATES = 5;
int currentStateIndex = 0;

unsigned long lastAutoPublishTime = 0;
const unsigned long AUTO_PUBLISH_INTERVAL = 15000; // 15초마다 다음 시나리오 자동 전송 (비활성화 가능)
bool autoPublishEnabled = false;                  // true로 변경 시 15초마다 자동 전송

// 버튼 디바운스 변수
int lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// ==============================================================================
// 3. Wi-Fi 연결 함수
// ==============================================================================
void setupWiFi() {
  delay(100);
  Serial.println();
  Serial.print("[Wi-Fi] 연결 시도 중: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("[Wi-Fi] 연결 완료!");
  Serial.print("[Wi-Fi] 할당된 IP: ");
  Serial.println(WiFi.localIP());
}

// ==============================================================================
// 4. MQTT 브로커 재연결 함수
// ==============================================================================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("[MQTT] 윈도우 PC 브로커(");
    Serial.print(mqtt_server);
    Serial.print(":");
    Serial.print(mqtt_port);
    Serial.print(") 접속 시도 중...");

    // 고유 Client ID 생성
    String clientId = "ESP8266Client-" + String(ESP.getChipId(), HEX);

    // 익명 접속 시도 (계정 불필요)
    if (client.connect(clientId.c_str())) {
      Serial.println(" 성공!");
      Serial.println("--------------------------------------------------");
      Serial.println("[안내] 시리얼 모니터에 번호를 입력하여 메시지를 전송하세요:");
      Serial.println(" 1 : normal    (정상)");
      Serial.println(" 2 : warning   (혼잡 주의)");
      Serial.println(" 3 : critical  (위험 우회)");
      Serial.println(" 4 : emergency (응급 대피)");
      Serial.println(" 5 : restore   (흐름 회복)");
      Serial.println(" a : 15초 자동 반복 토글 (ON/OFF)");
      Serial.println(" [NodeMCU FLASH 버튼] 클릭 시 다음 상태 순차 전송");
      Serial.println("--------------------------------------------------");
    } else {
      Serial.print(" 실패 (에러코드: ");
      Serial.print(client.state());
      Serial.println(") 5초 후 재시도합니다...");
      delay(500);
    }
  }
}

// ==============================================================================
// 5. 교통 메시지 발행(Publish) 함수
// ==============================================================================
void publishTrafficMessage(const char* state) {
  if (!client.connected()) {
    reconnectMQTT();
  }

  Serial.print("[MQTT 발행] 토픽: ");
  Serial.print(topic_traffic);
  Serial.print(" | 메시지: ");
  Serial.println(state);

  // 메시지 전송
  bool success = client.publish(topic_traffic, state);

  if (success) {
    Serial.println(">> 전송 완료! (웹 대시보드에서 한국어 음성이 출력됩니다)");
  } else {
    Serial.println(">> 전송 실패! 브로커 연결 및 방화벽을 확인하세요.");
  }
}

// ==============================================================================
// 6. setup() 초기화
// ==============================================================================
void setup() {
  // 시리얼 모니터 (115200 bps)
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  setupWiFi();

  // MQTT 브로커 서버 및 포트 설정
  client.setServer(mqtt_server, mqtt_port);
}

// ==============================================================================
// 7. loop() 메인 반복
// ==============================================================================
void loop() {
  // Wi-Fi 및 MQTT 연결 유지
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // ----------------------------------------------------------------------------
  // 기능 A: 시리얼 모니터 문자 입력으로 전송 (학생 실습용)
  // ----------------------------------------------------------------------------
  if (Serial.available() > 0) {
    char cmd = Serial.read();

    switch (cmd) {
      case '1':
        publishTrafficMessage("normal");
        break;
      case '2':
        publishTrafficMessage("warning");
        break;
      case '3':
        publishTrafficMessage("critical");
        break;
      case '4':
        publishTrafficMessage("emergency");
        break;
      case '5':
        publishTrafficMessage("restore");
        break;
      case 'a':
      case 'A':
        autoPublishEnabled = !autoPublishEnabled;
        Serial.print("[모드] 15초 자동 반복: ");
        Serial.println(autoPublishEnabled ? "활성화(ON)" : "비활성화(OFF)");
        break;
      default:
        // 줄바꿈 등 기타 문자는 무시
        break;
    }
  }

  // ----------------------------------------------------------------------------
  // 기능 B: 물리 버튼(FLASH 버튼 D3) 클릭으로 전송
  // ----------------------------------------------------------------------------
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    // 버튼 눌림 감지 (Active LOW)
    static int buttonState = HIGH;
    if (reading != buttonState) {
      buttonState = reading;
      if (buttonState == LOW) {
        // 다음 상태 순차 전송
        publishTrafficMessage(trafficStates[currentStateIndex]);
        currentStateIndex = (currentStateIndex + 1) % TOTAL_STATES;
      }
    }
  }
  lastButtonState = reading;

  // ----------------------------------------------------------------------------
  // 기능 C: 자동 15초 간격 순차 전송 (옵션)
  // ----------------------------------------------------------------------------
  if (autoPublishEnabled && (millis() - lastAutoPublishTime >= AUTO_PUBLISH_INTERVAL)) {
    lastAutoPublishTime = millis();
    publishTrafficMessage(trafficStates[currentStateIndex]);
    currentStateIndex = (currentStateIndex + 1) % TOTAL_STATES;
  }
}
