#include <DallasTemperature.h>
#include <OneWire.h>
#include <PubSubClient.h>
#include <WiFi.h>


#include <SinricPro.h>
#include <SinricProTemperaturesensor.h>

// --- Datos de tu Red ---
const char *ssid = "H3SWifi_7582";
const char *password = "30545392";
const char *mqtt_server = "141.148.14.52";

// --- Credenciales Sinric Pro ---
#define APP_KEY "52fd38fd-f870-486c-bb5b-b43a8788fc53"
#define APP_SECRET                                                             \
  "8854d9ca-13fb-4e2d-9993-ce68b8b50cca-0fabc4ff-3cb8-4be4-89d4-68408875adbd"
#define TEMP_SENSOR_ID "6977e2fd40cb098d90c6f980"

// --- Configuración Sensor ---
OneWire ourWire(15);
DallasTemperature sensors(&ourWire);

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastSend = 0;
unsigned long lastSinricSend = 0; // Control de tiempo para Sinric

bool onPowerState(const String &deviceId, bool &state) {
  Serial.printf("Temperatura activada: %s\r\n", state ? "on" : "off");
  return true;
}

void setup() {
  Serial.begin(115200);
  sensors.begin();

  // Conectar WiFi de forma manual
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado");

  // Configuración MQTT
  client.setServer(mqtt_server, 1883);

  // Configuración Sinric Pro
  SinricProTemperaturesensor &mySensor = SinricPro[TEMP_SENSOR_ID];
  mySensor.onPowerState(onPowerState);

  // Inicializar SinricPro
  SinricPro.onConnected([]() { Serial.printf("Conectado a SinricPro\r\n"); });
  SinricPro.onDisconnected(
      []() { Serial.printf("Desconectado de SinricPro\r\n"); });
  SinricPro.begin(APP_KEY, APP_SECRET);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT...");
    // ID de cliente único: "ESP32_Agua"
    if (client.connect("ESP32_Agua")) {
      Serial.println("¡Conectado!");
    } else {
      Serial.print("Falló con estado: ");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void loop() {
  // Manejo de Sinric Pro
  SinricPro.handle();

  // Manejo de MQTT
  if (!client.connected())
    reconnect();
  client.loop();

  // Lectura del sensor
  // (Leemos más seguido para tener el dato fresco siempre)
  if (millis() - lastSend > 2000) {
    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);

    if (temp != DEVICE_DISCONNECTED_C) {
      // 1. Enviar a MQTT (cada 2 segs como antes)
      String msg = String(temp);
      client.publish("casa/esp32/datos", msg.c_str());
      Serial.println("Temp enviada MQTT: " + msg);

      // 2. Enviar a Sinric Pro (cada 60 segs para no saturar/bloquear)
      if (millis() - lastSinricSend > 60000) {
        SinricProTemperaturesensor &mySensor = SinricPro[TEMP_SENSOR_ID];
        // sendTemperatureEvent(temperature, humidity = -1)
        bool success = mySensor.sendTemperatureEvent(temp);
        if (success) {
          Serial.printf("Temp enviada a SinricPro: %f\r\n", temp);
        } else {
          Serial.printf("Fallo al enviar a SinricPro\r\n");
        }
        lastSinricSend = millis();
      }
    }
    lastSend = millis();
  }
}