# ESP8266 교통 관제 MQTT 연동 가이드 (아두이노 IDE)

ESP8266 (NodeMCU, D1 mini 등) 보드에서 윈도우 PC의 Mosquitto 브로커로 접속하여 `iot/traffic` 토픽으로 교통 상태 메시지를 발행(Publish)하는 실습용 아두이노 예제입니다.

---

## 1. 준비 사항

### 1) 아두이노 IDE에 ESP8266 보드 설치
1. 아두이노 IDE 실행 $\rightarrow$ `파일` $\rightarrow$ `환경설정 (Ctrl + ,)`
2. **추가적인 보드 매니저 URLs**에 아래 주소 입력 후 확인:
   ```text
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. `툴` $\rightarrow$ `보드` $\rightarrow$ `보드 매니저`에서 **esp8266** 검색 후 최신 버전 설치

### 2) MQTT 라이브러리 설치
1. 아두이노 IDE $\rightarrow$ `스케치` $\rightarrow$ `라이브러리 포함하기` $\rightarrow$ `라이브러리 관리 (Ctrl + Shift + I)`
2. 검색창에 **PubSubClient** 입력 (작성자: Nick O'Leary) $\rightarrow$ **설치**

---

## 2. 코드 열기 및 설정 수정

1. [`esp8266_traffic_mqtt.ino`](./esp8266_traffic_mqtt/esp8266_traffic_mqtt.ino) 파일을 아두이노 IDE로 엽니다.
2. 상단의 Wi-Fi 및 윈도우 PC 브로커 IP 주소를 본인 환경에 맞게 수정합니다:

```cpp
// 1. Wi-Fi 정보 입력
const char* ssid     = "학교_또는_집_와이파이_이름";
const char* password = "와이파이_비밀번호";

// 2. Mosquitto가 설치된 윈도우 PC의 IP 주소 (예: 192.168.0.50)
const char* mqtt_server = "192.168.0.50";
const int   mqtt_port   = 1883; // 일반 MQTT 포트 (1883)
```

---

## 3. 보드 선택 및 업로드

1. `툴` $\rightarrow$ `보드` $\rightarrow$ **NodeMCU 1.0 (ESP-12E Module)** (또는 사용하는 보드) 선택
2. `툴` $\rightarrow$ `포트` $\rightarrow$ 연결된 COM 포트 선택
3. **업로드 (Ctrl + U)** 클릭

---

## 4. 연동 테스트 방법

업로드 완료 후, 아두이노 IDE 우측 상단의 **시리얼 모니터 (Ctrl + Shift + M)**를 열고 통신 속도를 **115200 보드레이트**로 설정합니다.

### 방법 A: 시리얼 모니터에 번호 입력
시리얼 모니터 입력창에 아래 숫자를 입력하고 [전송]을 누르면 즉시 해당 메시지가 발행되고 웹 대시보드에서 한국어 음성이 출력됩니다:
- `1` : **normal** $\rightarrow$ `"현재 교통 상황이 정상 입니다."`
- `2` : **warning** $\rightarrow$ `"현재 교통 상황이 혼잡하오니 주의 하시기 바랍니다."`
- `3` : **critical** $\rightarrow$ `"현재 교통 상황이 위험하오니 우회 하시기 바랍니다."`
- `4` : **emergency** $\rightarrow$ `"현재 응급 상황이 발생하였으니 빨리 대피 하시기 바랍니다."`
- `5` : **restore** $\rightarrow$ `"현재 교통 흐름이 정상으로 회복 되었습니다."`
- `a` : **15초 주기 자동 순차 전송 모드 ON/OFF 토글**

### 방법 B: 보드의 물리 버튼(FLASH 버튼) 클릭
NodeMCU 보드에 내장된 **FLASH 버튼(D3/GPIO0)**을 누를 때마다 다음 교통 상태로 변경되며 순차적으로 발행됩니다.
