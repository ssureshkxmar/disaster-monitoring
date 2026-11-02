/*
 * ======================================================================================
 * DISASTER WATCH - ESP32 Real-Time Early Warning Station
 * Hardware: ESP32 Dev Module / NodeMCU-32S
 * Network: Wi-Fi SSID "DMS"
 * Cloud: ThingSpeak Channel 3562012 | Write API Key: RNJ01GKMG3U3TSYL
 * 
 * ESP32 Pin Configuration:
 *   - Water Sensor (Analog)         -> GPIO 34 (ADC1_CH6, 10-bit mode: 0-1023)
 *   - Rain Sensor (Digital DO)      -> GPIO 13 (Digital IN, LOW = Rain)
 *   - Soil Moisture (Digital DO)    -> GPIO 12 (Digital IN, LOW = Wet)
 *   - Vibration Sensor (SW-420 DO)  -> GPIO 14 (Digital IN, HIGH = Vibration)
 *   - DHT22 Temp/Humidity (DATA)    -> GPIO 4  (1-Wire Bus)
 * ======================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// Wi-Fi Credentials (Change to your active Wi-Fi / Hotspot)
const char* ssid     = "DMS";
const char* password = "Dms@123";

// ThingSpeak Cloud Settings
const char* host           = "api.thingspeak.com";
const char* writeApiKey    = "RNJ01GKMG3U3TSYL";
const unsigned long channelID = 3562012;

// ESP32 Hardware Pin Mapping
#define WATER_PIN      34   // ADC1 Channel 6
#define RAIN_PIN       13   // Digital Input
#define SOIL_PIN       12   // Digital Input
#define VIBRATION_PIN  14   // Digital Input
#define DHT_PIN        4    // Digital 1-Wire
#define DHT_TYPE       DHT22

// Initialize DHT
DHT dht(DHT_PIN, DHT_TYPE);

#define STATUS_LED     2    // ESP32 onboard blue LED (GPIO 2)

// Timing
unsigned long lastThingSpeakTime = 0;
const unsigned long postInterval = 15000; // 15-second rate limit

unsigned long lastSerialTime = 0;
const unsigned long serialInterval = 2000;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("[WIFI] Connecting to: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED, HIGH);
    Serial.println();
    Serial.println("[WIFI] Connected successfully!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println();
    Serial.println("[WIFI] Connection failed. Retrying later...");
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  pinMode(RAIN_PIN, INPUT);
  pinMode(SOIL_PIN, INPUT);
  pinMode(VIBRATION_PIN, INPUT);

  // Set ESP32 ADC resolution to 10-bit (0-1023) to match standard analog read
  analogReadResolution(10);

  dht.begin();

  Serial.println();
  Serial.println("==================================================");
  Serial.println("DISASTER WATCH: ESP32 PRODUCTION NODE");
  Serial.println("Target ThingSpeak Channel: 3561421");
  Serial.println("==================================================");

  connectWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Read Sensors
  int waterValue = analogRead(WATER_PIN); // 0-1023
  int rainRaw = digitalRead(RAIN_PIN);
  int soilRaw = digitalRead(SOIL_PIN);
  int vibrationRaw = digitalRead(VIBRATION_PIN);

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  int rainDetected = (rainRaw == LOW) ? 1 : 0;
  int soilWet = (soilRaw == LOW) ? 1 : 0;
  int vibrationDetected = (vibrationRaw == HIGH) ? 1 : 0;

  bool dhtValid = true;
  if (isnan(temperature) || isnan(humidity)) {
    dhtValid = false;
    temperature = 0.0;
    humidity = 0.0;
  }

  // 2. Serial Diagnostics
  if (currentMillis - lastSerialTime >= serialInterval) {
    lastSerialTime = currentMillis;

    Serial.println("--------- SENSOR DATA (ESP32) ---------");
    Serial.print("Water Sensor (GPIO 34): ");
    Serial.println(waterValue);

    Serial.print("Rain Status (GPIO 13):  ");
    Serial.println(rainDetected == 1 ? "RAIN DETECTED" : "NO RAIN");

    Serial.print("Soil Status (GPIO 12):  ");
    Serial.println(soilWet == 1 ? "WET" : "DRY");

    Serial.print("Vibration (GPIO 14):    ");
    Serial.println(vibrationDetected == 1 ? "VIBRATION DETECTED" : "NO VIBRATION DETECTED");

    if (!dhtValid) {
      Serial.println("DHT22 (GPIO 4):         Sensor reading error");
    } else {
      Serial.print("Temperature (GPIO 4):   ");
      Serial.print(temperature, 1);
      Serial.println(" C");

      Serial.print("Humidity (GPIO 4):      ");
      Serial.print(humidity, 1);
      Serial.println(" %");
    }
    Serial.println("---------------------------------------");
  }

  // 3. Upload to ThingSpeak
  if (currentMillis - lastThingSpeakTime >= postInterval) {
    lastThingSpeakTime = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      digitalWrite(STATUS_LED, HIGH);
      Serial.println("[THINGSPEAK] Sending packet to Channel 3561421...");

      HTTPClient http;
      String url = "http://";
      url += host;
      url += "/update?api_key=";
      url += writeApiKey;
      url += "&field1=" + String(waterValue);
      url += "&field2=" + String(rainDetected);
      url += "&field3=" + String(soilWet);
      url += "&field4=" + String(vibrationDetected);
      
      if (dhtValid) {
        url += "&field5=" + String(temperature, 1);
        url += "&field6=" + String(humidity, 1);
      }

      http.begin(url);
      int httpCode = http.GET();

      if (httpCode > 0) {
        String payload = http.getString();
        int entryId = payload.toInt();
        if (entryId > 0) {
          Serial.print("[THINGSPEAK] Upload Success! Entry ID: ");
          Serial.println(entryId);
        } else {
          Serial.print("[THINGSPEAK] Response code: ");
          Serial.println(payload);
        }
      } else {
        Serial.print("[THINGSPEAK] HTTP Request Failed: ");
        Serial.println(http.errorToString(httpCode).c_str());
      }

      http.end();
      digitalWrite(STATUS_LED, LOW);
    }
  }

  delay(50);
}

