#include <WiFi.h>
#include <WiFiClient.h>

#include <ArduinoIoTCloud.h>
#include <Arduino_ConnectionHandler.h>

#include <PubSubClient.h>

#include <OneWire.h>
#include <DallasTemperature.h>

#include <time.h>

#include "esp_heap_caps.h"

#include "thingProperties.h"

// ============================================================
// VARIABLES NECESARIAS EN ARDUINO IOT CLOUD
// ============================================================
//
// float temp_water;
// float ambTemp;
// float tempThreshold;
//
// int freeHeap;
// int wifiRSSI;
// bool mqttConnected;
// int uptimeSec;
// bool alarmHighTemp;
// int sensorErrors;
//
// ============================================================

// ============================================================
// CONFIG
// ============================================================

#define FW_VERSION                     "2.5.0-dual-sensor"

#define DEBUG_ENABLE                   1

#define SENSOR_PIN                     15

#define MQTT_PORT                      1883

#define MQTT_TOPIC_DATA                "casa/esp32/datos"
#define MQTT_TOPIC_STATUS              "casa/esp32/status"
#define MQTT_TOPIC_ALERTS              "casa/esp32/alerts"

#define DEVICE_NAME                    "ESP32_Neka"

#define SENSOR_RESOLUTION              10
#define SENSOR_CONVERSION_TIME_MS      200

#define SENSOR_READ_INTERVAL_MS        10000

#define MQTT_RECONNECT_INTERVAL_MS     5000

#define WATCHDOG_SENSOR_TIMEOUT_MS     30000

#define MAX_OFFLINE_QUEUE              10

// ============================================================
// DEBUG
// ============================================================

#if DEBUG_ENABLE
  #define DBG(x) Serial.print(x)
  #define DBGLN(x) Serial.println(x)
#else
  #define DBG(x)
  #define DBGLN(x)
#endif

// ============================================================
// WIFI / MQTT
// ============================================================

WiFiClient wifiClient;

PubSubClient mqttClient(wifiClient);

// ============================================================
// DS18B20
// ============================================================

OneWire oneWire(SENSOR_PIN);

DallasTemperature sensors(&oneWire);

// SENSOR AGUA
DeviceAddress sensorWater = {
  0x28, 0xF8, 0x1F, 0x97,
  0x94, 0x05, 0x03, 0x12
};

// SENSOR AMBIENTE
DeviceAddress sensorAmbient = {
  0x28, 0xF8, 0x1F, 0x97,
  0x94, 0x05, 0x03, 0x12
};

// ============================================================
// FSM SENSOR
// ============================================================

enum SensorState {
  SENSOR_IDLE,
  SENSOR_WAIT
};

SensorState sensorState = SENSOR_IDLE;

// ============================================================
// VARIABLES
// ============================================================

unsigned long lastSensorRequest = 0;
unsigned long conversionStart = 0;
unsigned long lastMQTTReconnect = 0;
unsigned long lastSensorOK = 0;

// VARIABLES INTERNAS
float tempWater = NAN;
float tempAmbient = NAN;

uint32_t localSensorErrors = 0;

// ============================================================
// OFFLINE QUEUE
// ============================================================

struct OfflineMessage {

  char payload[256];
};

OfflineMessage offlineQueue[MAX_OFFLINE_QUEUE];

volatile int queueHead = 0;
volatile int queueTail = 0;

// ============================================================
// UTILIDADES
// ============================================================

bool validTemp(float t) {

  return (
    t != DEVICE_DISCONNECTED_C &&
    t != 85.0 &&
    !isnan(t) &&
    t > -40 &&
    t < 125
  );
}

// ============================================================
// NTP
// ============================================================

void setupNTP() {

  configTime(
    -5 * 3600,
    0,
    "pool.ntp.org",
    "time.nist.gov"
  );
}

void getISOTime(char* buffer, size_t len) {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {

    snprintf(
      buffer,
      len,
      "1970-01-01T00:00:00"
    );

    return;
  }

  strftime(
    buffer,
    len,
    "%Y-%m-%dT%H:%M:%S",
    &timeinfo
  );
}

// ============================================================
// OFFLINE QUEUE
// ============================================================

bool queueIsFull() {

  return (
    (queueTail + 1) % MAX_OFFLINE_QUEUE
    == queueHead
  );
}

bool queueIsEmpty() {

  return queueHead == queueTail;
}

void enqueuePayload(const char* payload) {

  if (queueIsFull()) {
    return;
  }

  strncpy(
    offlineQueue[queueTail].payload,
    payload,
    sizeof(offlineQueue[queueTail].payload)
  );

  queueTail =
    (queueTail + 1) % MAX_OFFLINE_QUEUE;
}

bool dequeuePayload(char* out) {

  if (queueIsEmpty())
    return false;

  strcpy(
    out,
    offlineQueue[queueHead].payload
  );

  queueHead =
    (queueHead + 1) % MAX_OFFLINE_QUEUE;

  return true;
}

// ============================================================
// CALLBACKS CLOUD
// ============================================================

void onTempThresholdChange() {}

void onAmbTempChange() {}

void onTempwaterChange() {}

void onFreeHeapChange() {}

void onWifiRSSIChange() {}

void onMqttConnectedChange() {}

void onUptimeSecChange() {}

void onAlarmHighTempChange() {}

void onSensorErrorsChange() {}

void onIoTCloudConnect() {

  mqttClient.disconnect();
}

// ============================================================
// MQTT
// ============================================================

void reconnectMQTT() {

  if (mqttClient.connected())
    return;

  if (
    millis() - lastMQTTReconnect
    < MQTT_RECONNECT_INTERVAL_MS
  )
    return;

  lastMQTTReconnect = millis();

  bool ok = mqttClient.connect(
    DEVICE_NAME,
    MQTT_TOPIC_STATUS,
    1,
    true,
    "offline"
  );

  if (ok) {

    mqttConnected = true;

    mqttClient.publish(
      MQTT_TOPIC_STATUS,
      "online",
      true
    );

  } else {

    mqttConnected = false;
  }
}

// ============================================================
// PUBLICACIÓN MQTT
// ============================================================

void publishPayload(const char* payload) {

  if (mqttClient.connected()) {

    mqttClient.publish(
      MQTT_TOPIC_DATA,
      payload,
      true
    );

  } else {

    enqueuePayload(payload);
  }
}

void flushOfflineQueue() {

  if (!mqttClient.connected())
    return;

  char payload[256];

  while (dequeuePayload(payload)) {

    mqttClient.publish(
      MQTT_TOPIC_DATA,
      payload,
      true
    );
  }
}

// ============================================================
// ALERTAS
// ============================================================

void publishAlert(const char* msg) {

  if (!mqttClient.connected())
    return;

  mqttClient.publish(
    MQTT_TOPIC_ALERTS,
    msg,
    true
  );
}

// ============================================================
// MÉTRICAS CLOUD
// ============================================================

void updateCloudMetrics() {

  freeHeap = ESP.getFreeHeap();

  wifiRSSI = WiFi.RSSI();

  mqttConnected = mqttClient.connected();

  uptimeSec = millis() / 1000;

  alarmHighTemp =
    (
      tempThreshold > 0 &&
      tempWater > tempThreshold
    );

  sensorErrors = localSensorErrors;
}

// ============================================================
// TELEMETRÍA MQTT
// ============================================================

void publishTelemetry() {

  char payload[256];

  char iso[32];

  getISOTime(iso, sizeof(iso));

  snprintf(
  payload,
  sizeof(payload),

  "{"
  "\"timestamp\":\"%s\","
  "\"temp_water\":%.2f,"
  "\"ambTemp\":%.2f,"
  "\"heap\":%u,"
  "\"wifi_rssi\":%d,"
  "\"uptime_sec\":%lu,"
  "\"mqtt\":%s,"
  "\"alarm\":%s,"
  "\"sensor_errors\":%lu,"
  "\"firmware\":\"%s\""
  "}",

  iso,

  tempWater,
  tempAmbient,

  ESP.getFreeHeap(),

  WiFi.RSSI(),

  millis() / 1000,

  mqttClient.connected()
    ? "true"
    : "false",

  alarmHighTemp
    ? "true"
    : "false",

  localSensorErrors,

  FW_VERSION
);

  publishPayload(payload);

#if DEBUG_ENABLE

  Serial.println(payload);

#endif
}

// ============================================================
// SENSOR FSM
// ============================================================

void updateSensorFSM() {

  switch (sensorState) {

    case SENSOR_IDLE:

      if (
        millis() - lastSensorRequest
        >= SENSOR_READ_INTERVAL_MS
      ) {

        lastSensorRequest = millis();

        sensors.requestTemperatures();

        conversionStart = millis();

        sensorState = SENSOR_WAIT;
      }

      break;

    case SENSOR_WAIT:

      if (
        millis() - conversionStart
        >= SENSOR_CONVERSION_TIME_MS
      ) {

        // LECTURA CORRECTA POR DIRECCIÓN
        float w =
          sensors.getTempC(sensorWater);

        float a =
          sensors.getTempC(sensorAmbient);

#if DEBUG_ENABLE

        Serial.print("Water: ");
        Serial.println(w);

        Serial.print("Ambient: ");
        Serial.println(a);

#endif

        bool waterOK = validTemp(w);

        bool ambientOK = validTemp(a);

        if (waterOK && ambientOK) {

          tempWater = w;

          tempAmbient = a;

          lastSensorOK = millis();

          // CLOUD
          temp_water = tempWater;

          ambTemp = tempAmbient;

          updateCloudMetrics();

          // MQTT
          publishTelemetry();

          if (alarmHighTemp) {

            publishAlert(
              "ALERTA temperatura agua"
            );
          }

        } else {

          localSensorErrors++;

          sensorErrors = localSensorErrors;

#if DEBUG_ENABLE

          Serial.println(
            "ERROR SENSOR"
          );

#endif

          publishAlert(
            "ERROR SENSOR DS18B20"
          );
        }

        sensorState = SENSOR_IDLE;
      }

      break;
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================

void checkHealth() {

  if (
    millis() - lastSensorOK
    > WATCHDOG_SENSOR_TIMEOUT_MS
  ) {

    publishAlert(
      "WATCHDOG sensores timeout"
    );
  }
}

// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);

  delay(2000);

  // SENSORES
  sensors.begin();

  sensors.setResolution(
    SENSOR_RESOLUTION
  );

  sensors.setWaitForConversion(false);

#if DEBUG_ENABLE

  Serial.print("Sensores encontrados: ");

  Serial.println(
    sensors.getDeviceCount()
  );

#endif

  if (!sensors.isConnected(sensorWater)) {

    localSensorErrors++;

#if DEBUG_ENABLE

    Serial.println(
      "Sensor WATER NO detectado"
    );

#endif
  }

  if (!sensors.isConnected(sensorAmbient)) {

    localSensorErrors++;

#if DEBUG_ENABLE

    Serial.println(
      "Sensor AMBIENT NO detectado"
    );

#endif
  }

  // CLOUD
  initProperties();

  ArduinoCloud.begin(
    ArduinoIoTPreferredConnection
  );

  ArduinoCloud.addCallback(
    ArduinoIoTCloudEvent::CONNECT,
    onIoTCloudConnect
  );

  // MQTT
  mqttClient.setServer(
    SECRET_MQTT_SERVER,
    MQTT_PORT
  );

  mqttClient.setSocketTimeout(2);

  // NTP
  setupNTP();

  lastSensorOK = millis();

  updateCloudMetrics();

#if DEBUG_ENABLE

  Serial.println("Sistema iniciado");

#endif
}

// ============================================================
// LOOP
// ============================================================

void loop() {

  // CLOUD PRIMERO
  ArduinoCloud.update();

  // MQTT
  if (WiFi.status() == WL_CONNECTED) {

    reconnectMQTT();

    mqttClient.loop();

    flushOfflineQueue();

  } else {

    mqttConnected = false;
  }

  // FSM SENSORES
  updateSensorFSM();

  // HEALTH
  checkHealth();

  // IMPORTANTE
  delay(2);
}