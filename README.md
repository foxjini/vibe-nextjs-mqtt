# VIBE MQTT 2026 // 스마트 한국어 교통 관제 음성 시스템

Next.js(TypeScript) 기반으로 실시간 MQTT 브로커와 통신하여, `iot/traffic` 토픽으로 수신되는 메시지에 따라 Chrome 내장 **'Google 한국어'** 음성(TTS)을 자연스러운 표준 톤으로 자동 송출하는 스마트 교통 관제 대시보드 시스템입니다.

---

## 📌 Mosquitto 브로커 필수 설정 가이드 (`mosquitto.conf`)

다른 윈도우 PC(또는 로컬 PC)에 설치된 Mosquitto 브로커(v2.0 이상)는 보안상 **기본적으로 로컬 루프백(`127.0.0.1`) 전용으로만 동작하고 외부 접속 및 익명 접속이 전면 차단**되어 있습니다.

외부 PC 및 웹 브라우저가 접속할 수 있도록 Mosquitto 설치 경로(기본: `C:\Program Files\mosquitto\mosquitto.conf`)의 설정 파일을 메모장(관리자 권한)으로 열어 다음 설정을 추가합니다.

### 1. 설정 코드 추가 (mosquitto.conf)

파일의 맨 아래에 다음 내용을 작성하고 저장합니다:

```conf
# =======================================================
# 1. 익명 접속 허용
# =======================================================
allow_anonymous true

# =======================================================
# 2. 일반 MQTT TCP 포트(1883)를 모든 외부 IP에 개방
# =======================================================
# 0.0.0.0을 지정하여 모든 네트워크 인터페이스(외부 IP)에서 접속 허용
listener 1883 0.0.0.0
protocol mqtt

# =======================================================
# 3. 웹소켓 포트(9001)를 모든 외부 IP에 개방 (Chrome 브라우저 필수)
# =======================================================
listener 9001 0.0.0.0
protocol websockets
```

> 💡 **설정 설명**:
> - `allow_anonymous true`: 계정(아이디/비밀번호) 없이 누구나 브로커에 접속할 수 있도록 허용합니다.
> - `listener 1883 0.0.0.0`: 터미널(`mosquitto_pub`, Python 등) 장치들이 통신하는 표준 MQTT 포트를 모든 외부 IP 대역(`0.0.0.0`)에 개방합니다.
> - `listener 9001 0.0.0.0`: 웹 브라우저(Chrome)가 통신할 수 있는 WebSocket 전용 포트를 모든 외부 IP 대역(`0.0.0.0`)에 개방합니다.
> - `protocol websockets`: 해당 포트(9001)의 통신 프로토콜을 WebSocket으로 지정합니다.

---

### 2. Mosquitto 서비스 재시작 (설정 적용)

`mosquitto.conf` 수정 후, 브로커 PC의 **명령 프롬프트 또는 PowerShell(관리자 권한)**에서 서비스를 재시작해야 변경 사항이 적용됩니다:

```cmd
net stop mosquitto
net start mosquitto
```
*(또는 `Win + R` → `services.msc` 실행 후 **Mosquitto Broker** 서비스를 마우스 우클릭하여 '다시 시작' 클릭)*

---

### 3. 브로커 PC의 Windows 방화벽 포트 개방

외부 PC에서 접속하려면 브로커가 설치된 PC의 **Windows Defender 방화벽**에서 1883 및 9001 포트의 인바운드를 허용해야 합니다.  
브로커 PC의 **PowerShell(관리자 권한)**에서 아래 두 줄을 실행합니다:

```powershell
# 1. 일반 MQTT 포트 (1883) 인바운드 허용
New-NetFirewallRule -DisplayName "Mosquitto MQTT 1883" -Direction Inbound -LocalPort 1883 -Protocol TCP -Action Allow

# 2. 브라우저 웹소켓 포트 (9001) 인바운드 허용
New-NetFirewallRule -DisplayName "Mosquitto WebSocket 9001" -Direction Inbound -LocalPort 9001 -Protocol TCP -Action Allow
```

---

## 🚦 시스템 토픽 및 음성 매핑 안내

본 시스템은 **`iot/traffic`** 단일 토픽을 구독하며, Chrome 내장 **'Google 한국어'** 음성(피치 1.0, 속도 1.0)으로 안내합니다.

| 수신 메시지 (Payload) | 한국어 음성 출력 멘트 |
| :--- | :--- |
| **`normal`** | "현재 교통 상황이 정상 입니다." |
| **`warning`** | "현재 교통 상황이 혼잡하오니 주의 하시기 바랍니다." |
| **`critical`** | "현재 교통 상황이 위험하오니 우회 하시기 바랍니다." |
| **`emergency`** | "현재 응급 상황이 발생하였으니 빨리 대피 하시기 바랍니다." |
| **`restore`** | "현재 교통 흐름이 정상으로 회복 되었습니다." |

---

## 💻 PowerShell 테스트 발행(Publish) 명령어

브로커 IP(예: `192.168.0.50`)로 테스트 메시지를 전송하는 명령어입니다:

### 1) 프로젝트 내장 CLI 스크립트 사용 (추천)
```powershell
# 사용법: npm run pub -- <브로커_IP> <메시지>

npm run pub -- 192.168.0.50 normal
npm run pub -- 192.168.0.50 warning
npm run pub -- 192.168.0.50 critical
npm run pub -- 192.168.0.50 emergency
npm run pub -- 192.168.0.50 restore
```

### 2) `mosquitto_pub` CLI 사용
```powershell
mosquitto_pub -h 192.168.0.50 -p 1883 -t "iot/traffic" -m "normal"
mosquitto_pub -h 192.168.0.50 -p 1883 -t "iot/traffic" -m "warning"
mosquitto_pub -h 192.168.0.50 -p 1883 -t "iot/traffic" -m "critical"
mosquitto_pub -h 192.168.0.50 -p 1883 -t "iot/traffic" -m "emergency"
mosquitto_pub -h 192.168.0.50 -p 1883 -t "iot/traffic" -m "restore"
```

---

## 🚀 웹 대시보드 실행

```bash
# 개발 서버 구동
npm run dev
```

1. Chrome 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속
2. 상단 헤더 우측 **`[오디오 켜기 (클릭)]`** 버튼 클릭 (음성 활성화)
3. **`[설정]`** 버튼 클릭 후 원격 브로커 PC의 IP를 입력하고 **`[저장 및 재연결]`**

---

## 🤖 ESP8266 마이크로컨트롤러 연동 예제

ESP8266(NodeMCU, D1 mini 등) 보드에서 Wi-Fi를 통해 윈도우 PC의 Mosquitto 브로커(`1883` 포트)로 직접 교통 메시지를 전송하는 아두이노 스케치 코드가 포함되어 있습니다.

- **아두이노 소스 코드**: [`esp8266/esp8266_traffic_mqtt/esp8266_traffic_mqtt.ino`](./esp8266/esp8266_traffic_mqtt/esp8266_traffic_mqtt.ino)
- **상세 실습 가이드**: [`esp8266/README.md`](./esp8266/README.md)

### 빠른 연동 테스트 방법:
1. 아두이노 IDE에서 `PubSubClient` 라이브러리를 설치합니다.
2. 스케치 상단의 `ssid`, `password`, `mqtt_server`(윈도우 PC IP)를 입력하고 업로드합니다.
3. 시리얼 모니터(115200 bps)에서 `1`, `2`, `3`, `4`, `5` 번호를 전송하거나 보드의 **FLASH 버튼**을 누르면 실시간으로 메시지가 전송되어 웹 대시보드에서 음성이 재생됩니다.

