# DISASTER WATCH — Real IoT Disaster Monitoring System
### NodeMCU ESP8266 / ESP32 + ThingSpeak Cloud + Real-Time Web Dashboard

A complete, working end-to-end IoT disaster monitoring and early warning system connecting real physical sensors to **ThingSpeak Cloud** and a real-time web command dashboard.

---

## 1. Quick Hardware Setup (NodeMCU 1.0 ESP-12E)

### Pin Connections

| Sensor | Sensor Pin | ESP8266 Pin | ESP8266 GPIO | Logic / Reading Behavior |
| :--- | :---: | :---: | :---: | :--- |
| **Water Sensor** | Analog Out (AO) | **`A0`** | `ADC0` | `0 – 1023` (Higher value = higher water level) |
| **Rain Sensor (DO)** | Digital Out (DO) | **`D7`** | `GPIO 13` | `LOW` = Rain Detected, `HIGH` = No Rain |
| **Soil Moisture (DO)**| Digital Out (DO) | **`D6`** | `GPIO 12` | `LOW` = Wet / Saturated, `HIGH` = Dry |
| **Vibration Sensor** | Digital Out (DO) | **`D5`** | `GPIO 14` | `HIGH` = Vibration Detected, `LOW` = Quiescent |
| **DHT22 Sensor** | Data Out | **`D2`** | `GPIO 4` | Ambient Temp (°C) and Humidity (% RH) |
| **Power / Ground** | VCC / GND | **`3V3`** & **`GND`**| — | Power supply from NodeMCU 3.3V rail |

---

## 2. ThingSpeak Cloud Configuration

- **Channel ID**: `3561421`
- **Channel Name**: `Disaster Early Warning System details`
- **Write API Key**: `JUYB83S6AJST0E9N`
- **Read API Key**: `8GDSH97J4Z1R4HIX`
- **Wi-Fi SSID**: `SURESHKUMAR`
- **Wi-Fi Password**: `SURESHKUMAR`

### Field Definitions
- **Field 1**: Water Sensor Analog Reading (`0–1023`)
- **Field 2**: Rain Sensor Digital Status (`1` = Rain Detected, `0` = No Rain)
- **Field 3**: Soil Moisture Digital Status (`1` = Wet, `0` = Dry)
- **Field 4**: Vibration Status (`1` = Vibration Detected, `0` = No Vibration)
- **Field 5**: Temperature (`°C`)
- **Field 6**: Relative Humidity (`% RH`)

---

## 3. Microcontroller Firmware Code

The complete source code is ready to open and upload in Arduino IDE:

### A. NodeMCU 1.0 ESP-12E Code
- Located at: [`esp8266_disaster_monitor/esp8266_disaster_monitor.ino`](file:///c:/Projects/disaster/esp8266_disaster_monitor/esp8266_disaster_monitor.ino)
- **Arduino IDE Board Settings**:
  - Tools > Board > ESP8266 Boards > **NodeMCU 1.0 (ESP-12E Module)**
  - Tools > CPU Frequency > **80 MHz**
  - Tools > Upload Speed > **115200**
- **Required Arduino Library**:
  - `DHT sensor library` by Adafruit (Includes `Adafruit Unified Sensor`)

### B. ESP32 Code
- Located at: [`esp32_disaster_monitor/esp32_disaster_monitor.ino`](file:///c:/Projects/disaster/esp32_disaster_monitor/esp32_disaster_monitor.ino)
- **Arduino IDE Board Settings**:
  - Tools > Board > ESP32 Arduino > **ESP32 Dev Module**
  - Pinout: Water on `GPIO 34`, Rain on `GPIO 13`, Soil on `GPIO 12`, Vibration on `GPIO 14`, DHT22 on `GPIO 4`.

---

## 4. Real Web Dashboard Operation

The web dashboard is live at **`http://localhost:3000`** (or open [`index.html`](file:///c:/Projects/disaster/index.html) in your browser).

- **Real ThingSpeak Cloud Client (`js/thingspeak-client.js`)**:
  - Continuously polls your ThingSpeak Channel `3561421` every 5 seconds using your Read Key `8GDSH97J4Z1R4HIX`.
  - Parses real values for Water (A0), Rain (D7), Soil (D6), Vibration (D5), Temperature, and Humidity.
  - Dynamically calculates the **Real Threat Level** (`NORMAL`, `ADVISORY`, `WATCH`, `WARNING`, `CRITICAL`) and **Environmental Risk Score (0-100)** from the live sensor data.
  - Automatically feeds all 6 historical analytics graphs with the live telemetry feed.
  - Converts past ThingSpeak entries into structured audit events in the Recent Events table.
  - Includes a **"Send Test Packet"** button directly in the header to dispatch live test telemetry to your ThingSpeak channel and verify synchronization instantly.

---

## 5. Verification & Testing

1. Open **`http://localhost:3000`** in your browser.
2. Note the green badge in the top bar: **`THINGSPEAK: ONLINE (Channel 3561421)`**.
3. Upload the Arduino code to your NodeMCU using the Arduino IDE.
4. Open the Arduino Serial Monitor at `115200 baud`. When the board connects to Wi-Fi `SURESHKUMAR`, it will output sensor readings every 2 seconds and push an update to ThingSpeak every 15 seconds.
5. Watch the dashboard update live with your actual hardware readings!
