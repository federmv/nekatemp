#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuración de WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// URL del servidor en Oracle Cloud (IP Pública)
// Ejemplo: "http://123.45.67.89:3001/api/data"
const char* serverUrl = "http://TU_IP_ORACLE_WEB:3001/api/data";

void setup() {
  Serial.begin(115200);

  // Conexión WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Simulación de lectura de sensor
    float temp = random(2000, 3000) / 100.0; // 20.00 - 30.00
    float hum = random(4000, 6000) / 100.0;  // 40.00 - 60.00

    Serial.printf("Enviando T:%.2f, H:%.2f\n", temp, hum);

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Crear JSON
    StaticJsonDocument<200> doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Respuesta: " + response);
    } else {
      Serial.print("Error en el envío: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }

  delay(10000); // Envío cada 10 segundos
}
