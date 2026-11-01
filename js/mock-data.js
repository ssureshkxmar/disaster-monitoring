/**
 * DISASTER WATCH - Enterprise Mock Data & Telemetry Definitions
 * Simulates high-fidelity edge telemetry from an ESP8266 NodeMCU disaster monitoring station.
 * 
 * IMPORTANT: Rainfall & Soil Moisture are digital threshold sensors (Wet / Dry only).
 * Unmeasured analog values are strictly labeled as "Not measured".
 */

const SYSTEM_METADATA = {
  stationId: "STATION-ALPHA-07",
  stationName: "Western Ghats Critical Catchment Node 4B",
  region: "Wayanad-Idukki Drainage Basin, Zone IV",
  coordinates: {
    lat: 11.6054,
    lng: 76.0822,
    elevation: "742 m ASL",
    slopeAngle: "28.5° NW Incline"
  },
  operator: "Emergency Operations Command (ECC-04)",
  watchstander: "Capt. S. Ramanathan — Shift Lead",
  firmware: "ESP-DWATCH-v2.8.4-RTOS",
  hardware: {
    mcu: "NodeMCU ESP8266-12F (Tensilica 32-bit L106 @ 80MHz)",
    mac: "A4:CF:12:8E:91:30",
    ip: "192.168.1.188",
    gateway: "192.168.1.1",
    subnet: "255.255.255.0",
    rssi: "-64 dBm",
    signalQuality: "92% (High)",
    freeHeap: "28,440 B / 48 KB",
    flashSize: "4096 KB (Flash ID: 0x1640ef)",
    supplyVoltage: "3.28V (Regulated)",
    wifiSsid: "SURESHKUMAR",
    protocol: "ThingSpeak Cloud (REST API)",
    channelId: "3561421",
    uptimeSeconds: 1607542 // ~18 days 14 hours
  },
  pins: [
    { pin: "A0", gpio: "ADC0", sensor: "Water Sensor", type: "Analog (0-1023)", status: "ONLINE", sampleRate: "500 ms" },
    { pin: "D7", gpio: "GPIO13", sensor: "Rain Sensor (DO)", type: "Digital Comparator (LOW=Rain)", status: "ONLINE", sampleRate: "Interrupt/1s" },
    { pin: "D6", gpio: "GPIO12", sensor: "Soil Moisture (DO)", type: "Digital Comparator (LOW=Wet)", status: "ONLINE", sampleRate: "1000 ms" },
    { pin: "D5", gpio: "GPIO14", sensor: "Vibration Sensor (SW-420)", type: "Digital Pulse (HIGH=Vibration)", status: "ONLINE", sampleRate: "Hardware Counter" },
    { pin: "D2", gpio: "GPIO4", sensor: "DHT22 Precision Ambient", type: "1-Wire Digital (Temp/RH)", status: "ONLINE", sampleRate: "2000 ms" }
  ]
};

const THREAT_PROFILES = {
  NORMAL: {
    level: "NORMAL",
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    color: "#10b981",
    riskScore: 18,
    assessment: "PROTOTYPE MONITORING INDICATOR: Environmental parameters are within quiescent baseline thresholds. Stream water level normal, rain sensor dry, soil intact, zero anomalous vibration. Low risk.",
    waterAnalog: 142,
    waterStatus: "DRY / BASEFLOW STABLE",
    waterCategory: "NORMAL",
    rainDigital: 0,
    rainStatus: "NO RAIN DETECTED",
    rainPinState: "PIN D2: HIGH (OPEN CIRCUIT)",
    soilDigital: 0,
    soilStatus: "DRY",
    soilPinState: "PIN D6: LOW (DRY THRESHOLD)",
    vibrationPulses: 0,
    vibrationStatus: "NO VIBRATION DETECTED",
    vibrationPinState: "PIN D5: LOW (QUIESCENT)",
    temp: 27.2,
    humidity: 61.4,
    dewPoint: 19.1,
    heatIndex: 28.3,
    activeAlertsCount: 0
  },
  ADVISORY: {
    level: "ADVISORY",
    badgeClass: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    color: "#eab308",
    riskScore: 42,
    assessment: "PROTOTYPE MONITORING INDICATOR: Initial raindrop sensor trip detected on station pad. Soil moisture currently within dry limit but ambient humidity elevating above 78%. Early watchstander advisory active.",
    waterAnalog: 275,
    waterStatus: "LOW BASEFLOW / MINOR RISE",
    waterCategory: "NORMAL",
    rainDigital: 1,
    rainStatus: "RAIN DETECTED",
    rainPinState: "PIN D2: LOW (CONDUCTIVE BRIDGE)",
    soilDigital: 0,
    soilStatus: "DRY (NEAR THRESHOLD)",
    soilPinState: "PIN D6: LOW (DRY THRESHOLD)",
    vibrationPulses: 1,
    vibrationStatus: "BACKGROUND AMBIENT (1 pulse)",
    vibrationPinState: "PIN D5: LOW (FILTERED)",
    temp: 24.8,
    humidity: 78.5,
    dewPoint: 20.8,
    heatIndex: 25.4,
    activeAlertsCount: 1
  },
  WATCH: {
    level: "WATCH",
    badgeClass: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    color: "#f97316",
    riskScore: 66,
    assessment: "PROTOTYPE MONITORING INDICATOR: Sustained rain detection accompanied by soil moisture digital threshold trip (WET). Culvert water level rising (485/1023). Drainage saturation in progress.",
    waterAnalog: 495,
    waterStatus: "MODERATE RUNOFF DETECTED",
    waterCategory: "WATCH",
    rainDigital: 1,
    rainStatus: "RAIN DETECTED",
    rainPinState: "PIN D2: LOW (CONDUCTIVE BRIDGE ACTIVE)",
    soilDigital: 1,
    soilStatus: "WET",
    soilPinState: "PIN D6: HIGH (SATURATED TRIP)",
    vibrationPulses: 6,
    vibrationStatus: "SPORADIC MICRO-VIBRATIONS (6 pulses)",
    vibrationPinState: "PIN D5: INTERMITTENT HIGH",
    temp: 23.2,
    humidity: 89.0,
    dewPoint: 21.3,
    heatIndex: 24.1,
    activeAlertsCount: 2
  },
  WARNING: {
    level: "WARNING",
    badgeClass: "text-red-400 bg-red-500/10 border-red-500/40",
    color: "#ef4444",
    riskScore: 84,
    assessment: "PROTOTYPE MONITORING INDICATOR: Water level probe exceeds secondary threshold (695/1023). Soil probe continuous WET. Slope vibration sensor registering 18 events/min. Localized flash flood / runoff alert.",
    waterAnalog: 710,
    waterStatus: "INUNDATION WARNING THRESHOLD",
    waterCategory: "WARNING",
    rainDigital: 1,
    rainStatus: "RAIN DETECTED (PERSISTENT)",
    rainPinState: "PIN D2: LOW (CONTINUOUS BRIDGE)",
    soilDigital: 1,
    soilStatus: "WET",
    soilPinState: "PIN D6: HIGH (FULL SATURATION)",
    vibrationPulses: 22,
    vibrationStatus: "VIBRATION DETECTED (22 events/min)",
    vibrationPinState: "PIN D5: PULSING TRAIN",
    temp: 22.0,
    humidity: 94.6,
    dewPoint: 21.1,
    heatIndex: 22.4,
    activeAlertsCount: 4
  },
  CRITICAL: {
    level: "CRITICAL",
    badgeClass: "text-red-300 bg-red-600/30 border-red-500 critical-pulse",
    color: "#dc2626",
    riskScore: 95,
    assessment: "PROTOTYPE MONITORING INDICATOR (HIGH SEVERITY): Sensor telemetry indicates critical river overflow / inundation (analog 915/1023). Soil saturated and high-frequency vibration triggers (>40 pulses/min) suggest possible slope movement / debris transit. Immediate command evaluation required.",
    waterAnalog: 915,
    waterStatus: "CRITICAL SUBMERSION / SURGE",
    waterCategory: "CRITICAL",
    rainDigital: 1,
    rainStatus: "RAIN DETECTED (HEAVY INFLOW)",
    rainPinState: "PIN D2: LOW (CONTINUOUS SUBMERGED)",
    soilDigital: 1,
    soilStatus: "WET",
    soilPinState: "PIN D6: HIGH (SATURATED LIQUEFACTION)",
    vibrationPulses: 48,
    vibrationStatus: "CRITICAL VIBRATION BURST (48 pulses/min)",
    vibrationPinState: "PIN D5: HIGH FREQ INTERRUPTS",
    temp: 21.1,
    humidity: 98.2,
    dewPoint: 20.8,
    heatIndex: 21.4,
    activeAlertsCount: 5
  }
};

// Historical timeseries datasets for 1h, 6h, 24h, 7d
const HISTORICAL_DATA = {
  "1h": {
    labels: ["-55m", "-50m", "-45m", "-40m", "-35m", "-30m", "-25m", "-20m", "-15m", "-10m", "-5m", "Now"],
    temp: [23.9, 23.8, 23.7, 23.6, 23.5, 23.4, 23.3, 23.2, 23.2, 23.1, 23.0, 23.2],
    humidity: [86.5, 87.0, 87.2, 87.8, 88.0, 88.4, 88.7, 88.9, 89.1, 89.0, 89.2, 89.0],
    waterAnalog: [380, 395, 410, 422, 435, 450, 462, 475, 480, 488, 492, 495],
    rainDigital: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0: No rain, 1: Rain
    soilDigital: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], // 0: Dry, 1: Wet
    vibrationPulses: [0, 0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 6]
  },
  "6h": {
    labels: ["-5.5h", "-5h", "-4.5h", "-4h", "-3.5h", "-3h", "-2.5h", "-2h", "-1.5h", "-1h", "-30m", "Now"],
    temp: [26.1, 25.8, 25.4, 25.0, 24.5, 24.2, 23.9, 23.6, 23.4, 23.3, 23.1, 23.2],
    humidity: [68.0, 71.5, 74.2, 77.0, 80.5, 83.1, 85.4, 87.0, 88.2, 88.9, 89.1, 89.0],
    waterAnalog: [180, 195, 220, 250, 290, 340, 390, 430, 460, 480, 490, 495],
    rainDigital: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    soilDigital: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    vibrationPulses: [0, 0, 0, 1, 0, 2, 1, 3, 2, 4, 5, 6]
  },
  "24h": {
    labels: ["-23h", "-21h", "-19h", "-17h", "-15h", "-13h", "-11h", "-9h", "-7h", "-5h", "-3h", "-1h", "Now"],
    temp: [28.5, 29.2, 28.0, 26.5, 25.1, 24.3, 23.8, 24.0, 25.5, 24.8, 23.9, 23.3, 23.2],
    humidity: [58.2, 54.0, 60.5, 67.2, 73.0, 78.5, 82.0, 80.5, 76.0, 79.2, 86.0, 88.9, 89.0],
    waterAnalog: [120, 115, 125, 130, 145, 160, 190, 220, 270, 310, 410, 480, 495],
    rainDigital: [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
    soilDigital: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    vibrationPulses: [0, 0, 0, 0, 1, 0, 0, 1, 0, 2, 3, 5, 6]
  },
  "7d": {
    labels: ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Yesterday", "Today"],
    temp: [27.8, 28.1, 27.4, 26.9, 25.5, 24.2, 23.2],
    humidity: [61.0, 59.5, 64.0, 70.2, 76.8, 83.5, 89.0],
    waterAnalog: [110, 115, 125, 140, 210, 380, 495],
    rainDigital: [0, 0, 0, 0, 1, 1, 1],
    soilDigital: [0, 0, 0, 0, 0, 1, 1],
    vibrationPulses: [0, 0, 1, 0, 2, 4, 6]
  }
};

const RECENT_EVENTS = [
  {
    id: "EVT-8941",
    sensor: "Water Sensor (A0)",
    description: "Analog level crossed secondary Watch threshold (495/1023). Rapid runoff rate +15 units/10m.",
    severity: "WATCH",
    timestamp: "2026-10-31 21:20:14",
    status: "ACTIVE"
  },
  {
    id: "EVT-8938",
    sensor: "SW-420 Vibration (D5)",
    description: "Multi-pulse burst recorded: 6 digital interrupts logged in 60s sample window.",
    severity: "ADVISORY",
    timestamp: "2026-10-31 21:14:02",
    status: "ACKNOWLEDGED"
  },
  {
    id: "EVT-8933",
    sensor: "Soil Moisture (D6)",
    description: "Digital threshold tripped to WET state (Pin D6 logic HIGH). Subsurface saturation confirmed.",
    severity: "WATCH",
    timestamp: "2026-10-31 20:52:19",
    status: "ACKNOWLEDGED"
  },
  {
    id: "EVT-8929",
    sensor: "Rain Sensor (D2)",
    description: "Precipitation bridge activated (Pin D2 logic LOW). Continuous surface moisture detected.",
    severity: "ADVISORY",
    timestamp: "2026-10-31 20:34:40",
    status: "ACKNOWLEDGED"
  },
  {
    id: "EVT-8921",
    sensor: "DHT22 Thermo-Hygro (D4)",
    description: "Relative humidity sustained above 85% for 4 consecutive polling frames.",
    severity: "NORMAL",
    timestamp: "2026-10-31 19:45:00",
    status: "RESOLVED"
  },
  {
    id: "EVT-8915",
    sensor: "System / NodeMCU",
    description: "Scheduled NTP time synchronization synchronized with time.google.com (Jitter: 4ms).",
    severity: "NORMAL",
    timestamp: "2026-10-31 18:00:00",
    status: "RESOLVED"
  },
  {
    id: "EVT-8902",
    sensor: "Water Sensor (A0)",
    description: "Analog channel calibration self-check completed. Baseline zero offset = 12 ADC counts.",
    severity: "NORMAL",
    timestamp: "2026-10-31 12:00:00",
    status: "RESOLVED"
  },
  {
    id: "EVT-8894",
    sensor: "Wi-Fi Telemetry Link",
    description: "MQTT Keep-Alive PINGRESP roundtrip: 38ms. Network signal RSSI stable at -64 dBm.",
    severity: "NORMAL",
    timestamp: "2026-10-31 06:12:44",
    status: "RESOLVED"
  },
  {
    id: "EVT-8880",
    sensor: "SW-420 Vibration (D5)",
    description: "Isolated ground shock pulse recorded (likely vehicular transit on access road 400m away).",
    severity: "ADVISORY",
    timestamp: "2026-10-30 22:15:08",
    status: "RESOLVED"
  },
  {
    id: "EVT-8865",
    sensor: "Rain Sensor (D2)",
    description: "Dry state restored on sensor pad after solar evaporation. Pin D2 restored to HIGH.",
    severity: "NORMAL",
    timestamp: "2026-10-30 14:30:10",
    status: "RESOLVED"
  }
];

const EARLY_WARNING_RULES = [
  {
    id: "RULE-FF-01",
    name: "Flash Flood Early Surge Threshold",
    trigger: "Water Sensor (A0) > 500 AND Rain Sensor (D2) == LOW (Rain)",
    action: "Trigger WATCH Threat State, dispatch telemetry burst to catchment basin units",
    currentCondition: "TRIGGERED (Active Watch)",
    status: "TRIGGERED",
    severity: "WATCH"
  },
  {
    id: "RULE-LS-02",
    name: "Slope Failure / Landslide Precursor",
    trigger: "Soil Sensor (D6) == HIGH (Wet) AND Vibration (D5) > 15 pulses/min",
    action: "Escalate to WARNING Threat State, alert hill-slope evacuation monitor",
    currentCondition: "MONITORING (Soil Wet, Vibration at 6/min)",
    status: "ARMED",
    severity: "WARNING"
  },
  {
    id: "RULE-DF-03",
    name: "Debris Flow Extreme Inundation",
    trigger: "Water Sensor (A0) > 850 AND Vibration (D5) > 35 pulses/min",
    action: "Trigger CRITICAL Threat State, engage station emergency strobe & ECC sirens",
    currentCondition: "STANDBY (Thresholds clear)",
    status: "STANDBY",
    severity: "CRITICAL"
  },
  {
    id: "RULE-TH-04",
    name: "Atmospheric Saturation Pre-storm Index",
    trigger: "Relative Humidity (DHT22) > 90% AND Temp Drop > 2°C/hr",
    action: "Generate ADVISORY event log, prime cloudburst early detection buffer",
    currentCondition: "TRIGGERED (RH @ 89.0%)",
    status: "TRIGGERED",
    severity: "ADVISORY"
  }
];

const MESH_NODES = [
  {
    id: "ALPHA-07",
    name: "Primary Hub (Node Alpha-07)",
    type: "ESP8266 Full Sensor Gateway",
    lat: 11.6054,
    lng: 76.0822,
    elevation: "742m",
    status: "ONLINE",
    threat: "WATCH",
    sensors: ["Water (A0)", "Rain (D2)", "Soil (D6)", "Vibration (D5)", "DHT22 (D4)"]
  },
  {
    id: "BETA-03",
    name: "Upstream Culvert Node (Beta-03)",
    type: "Solar Remote Mesh Satellite",
    lat: 11.6142,
    lng: 76.0718,
    elevation: "810m",
    status: "ONLINE",
    threat: "ADVISORY",
    sensors: ["Water Probe", "Rain Detector"]
  },
  {
    id: "GAMMA-05",
    name: "Ridge Slope Stability Node (Gamma-05)",
    type: "Battery Geophone Remote",
    lat: 11.5980,
    lng: 76.0945,
    elevation: "895m",
    status: "ONLINE",
    threat: "NORMAL",
    sensors: ["Vibration Sensor", "Soil Moisture"]
  },
  {
    id: "DELTA-02",
    name: "Downstream Bridge Monitoring (Delta-02)",
    type: "Bridge Structural Telemetry",
    lat: 11.5890,
    lng: 76.0650,
    elevation: "670m",
    status: "ONLINE",
    threat: "WATCH",
    sensors: ["Water Ultrasonic", "Vibration"]
  }
];

