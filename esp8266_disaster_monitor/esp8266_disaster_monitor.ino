/*
 * ======================================================================================
 * DISASTER WATCH - NodeMCU ESP8266 (ESP-12E) Real-Time Early Warning Station
 * Hardware: NodeMCU 1.0 (ESP-12E Module)
 * Network: Wi-Fi SSID "DMS"
 * Cloud: ThingSpeak Channel 3562012 | Write API Key: RNJ01GKMG3U3TSYL
 * 
 * Pin Configuration:
 *   - Water Sensor (Analog)         -> Pin A0 (ADC0)
 *   - Rain Sensor (Digital DO)      -> Pin D7 (GPIO13)
 *   - Soil Moisture (Digital DO)    -> Pin D6 (GPIO12)
 *   - Vibration Sensor (SW-420 DO)  -> Pin D5 (GPIO14)
 *   - DHT22 Temp/Humidity (DATA)    -> Pin D2 (GPIO4)
 * ======================================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <DHT.h>

// Wi-Fi Credentials
const char* ssid     = "DMS";
const char* password = "Dms@123";

// ThingSpeak Cloud Settings
const char* host           = "api.thingspeak.com";
const char* writeApiKey    = "RNJ01GKMG3U3TSYL";
const unsigned long channelID = 3562012;

// Exact Hardware Pin Mapping
#define WATER_PIN      A0   // Analog 0-1023
#define RAIN_PIN       D7   // GPIO 13 - Digital Comparator Out (LOW = Rain Detected)
#define SOIL_PIN       D6   // GPIO 12 - Digital Comparator Out (LOW = Wet)
#define VIBRATION_PIN  D5   // GPIO 14 - SW-420 Digital Trigger (HIGH = Vibration Detected)
#define DHT_PIN        D2   // GPIO 4  - DHT22 1-Wire Data
#define DHT_TYPE       DHT22

// Initialize DHT Sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Onboard Status LED
#define STATUS_LED LED_BUILTIN // Pin D4 (Active LOW on NodeMCU)

// Timing Variables
unsigned long lastThingSpeakTime = 0;
const unsigned long postInterval = 15000; // ThingSpeak free limit: 1 post per 15 seconds

unsigned long lastSerialTime = 0;
const unsigned long serialInterval = 2000; // Print to serial monitor every 2 seconds

// Function to connect or reconnect to Wi-Fi
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Blink while connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED, HIGH); // Off (active low)
    Serial.println();
    Serial.println("[WIFI] Successfully connected!");
    Serial.print("[WIFI] IP Address assigned: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println();
    Serial.println("[WIFI] Connection failed. Will retry next cycle...");
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH);

  pinMode(RAIN_PIN, INPUT);
  pinMode(SOIL_PIN, INPUT);
  pinMode(VIBRATION_PIN, INPUT);

  dht.begin();

  Serial.println();
  Serial.println("==================================================");
  Serial.println("DISASTER WATCH: EARLY WARNING & MONITORING SYSTEM");
  Serial.println("NodeMCU 1.0 (ESP-12E) Production Node Starting...");
  Serial.println("==================================================");
  Serial.println("Pins Configured:");
  Serial.println(" - Water: A0");
  Serial.println(" - Rain: D7");
  Serial.println(" - Soil: D6");
  Serial.println(" - Vibration: D5");
  Serial.println(" - DHT22: D2");
  Serial.println("==================================================");

  connectWiFi();
  delay(1000);
}

void loop() {
  unsigned long currentMillis = millis();

  // Auto-reconnect Wi-Fi if connection drops
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Read All Physical Sensors
  int waterValue = analogRead(WATER_PIN);
  int rainRaw = digitalRead(RAIN_PIN);
  int soilRaw = digitalRead(SOIL_PIN);
  int vibrationRaw = digitalRead(VIBRATION_PIN);

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Logic conversions based on user specifications:
  // Rain sensor DO: LOW = Rain Detected, HIGH = No Rain
  int rainDetected = (rainRaw == LOW) ? 1 : 0;

  // Soil sensor DO: LOW = Wet, HIGH = Dry
  int soilWet = (soilRaw == LOW) ? 1 : 0;

  // Vibration sensor DO: HIGH = Vibration Detected, LOW = Quiescent
  int vibrationDetected = (vibrationRaw == HIGH) ? 1 : 0;

  // Handle DHT read errors gracefully
  bool dhtValid = true;
  if (isnan(temperature) || isnan(humidity)) {
    dhtValid = false;
    temperature = 0.0;
    humidity = 0.0;
  }

  // 2. Serial Monitor Output (Every 2 seconds)
  if (currentMillis - lastSerialTime >= serialInterval) {
    lastSerialTime = currentMillis;

    Serial.println("--------- SENSOR DATA ---------");
    Serial.print("Water Sensor (A0): ");
    Serial.println(waterValue);

    Serial.print("Rain Status (D7):  ");
    Serial.println(rainDetected == 1 ? "RAIN DETECTED" : "NO RAIN");

    Serial.print("Soil Status (D6):  ");
    Serial.println(soilWet == 1 ? "WET" : "DRY");

    Serial.print("Vibration (D5):    ");
    Serial.println(vibrationDetected == 1 ? "VIBRATION DETECTED" : "NO VIBRATION DETECTED");

    if (!dhtValid) {
      Serial.println("DHT22 (D2):        Sensor reading error (check connection)");
    } else {
      Serial.print("Temperature (D2):  ");
      Serial.print(temperature, 1);
      Serial.println(" C");

      Serial.print("Humidity (D2):     ");
      Serial.print(humidity, 1);
      Serial.println(" %");
    }
    Serial.println("-------------------------------");
  }

  // 3. Send Telemetry to ThingSpeak Cloud (Every 15-20 seconds)
  if (currentMillis - lastThingSpeakTime >= postInterval) {
    lastThingSpeakTime = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      digitalWrite(STATUS_LED, LOW); // Turn on LED while uploading
      Serial.println("[THINGSPEAK] Uploading telemetry to Channel 3561421...");

      WiFiClient client;
      HTTPClient http;

      // Construct URL with fields:
      // Field 1: Water Sensor
      // Field 2: Rain Status (1: Rain, 0: No Rain)
      // Field 3: Soil Status (1: Wet, 0: Dry)
      // Field 4: Vibration Status (1: Vibration, 0: No Vibration)
      // Field 5: Temperature
      // Field 6: Humidity
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

      http.begin(client, url);
      int httpCode = http.GET();

      if (httpCode > 0) {
        String payload = http.getString();
        int entryId = payload.toInt();
        if (entryId > 0) {
          Serial.print("[THINGSPEAK] SUCCESS! Entry #");
          Serial.println(entryId);
        } else {
          Serial.print("[THINGSPEAK] Rate limited or duplicate. Response: ");
          Serial.println(payload);
        }
      } else {
        Serial.print("[THINGSPEAK] HTTP GET failed, error: ");
        Serial.println(http.errorToString(httpCode).c_str());
      }

      http.end();
      digitalWrite(STATUS_LED, HIGH); // Turn off LED
    } else {
      Serial.println("[THINGSPEAK] Cannot upload: Wi-Fi not connected.");
    }
  }

  delay(50); // Small loop yielding
}

