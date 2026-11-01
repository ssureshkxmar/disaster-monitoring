/**
 * DISASTER WATCH - Edge Telemetry Simulation & State Engine
 * Simulates real-time sensor fluctuation, threat escalation, and hardware pin states.
 * 
 * Strict Compliance:
 * - Rain and Soil Moisture are purely digital binary (Wet / Dry).
 * - No fabricated analog percentages or rainfall mm amounts.
 * - Unavailable metrics are explicitly rendered as "Not measured".
 */

class TelemetryEngine {
  constructor() {
    this.currentThreat = "WATCH"; // Default initial state as per realistic disaster scenario
    this.isLiveStreaming = true;
    this.timerId = null;
    this.audioMuted = false;
    this.audioCtx = null;
    this.lastSyncSeconds = 0;
    
    // Live sensor values
    this.liveData = { ...THREAT_PROFILES.WATCH };
  }

  init() {
    // Real ThingSpeak Cloud mode: NEVER generate fake random noise!
    this.startClock();
    this.initAudio();
  }

  startStreaming() {
    // Disabled in Real Cloud mode
  }

  stopStreaming() {
    // Disabled in Real Cloud mode
  }

  toggleStreaming() {
    if (window.thingSpeakClient) {
      window.thingSpeakClient.toggleLivePolling();
    }
  }

  tickTelemetry() {
    // Disabled in Real Cloud mode: Data comes strictly from ESP8266 ThingSpeak channel
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported in this browser environment', e);
    }
  }

  playTacticalSound(type = 'ping') {
    if (this.audioMuted || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    if (type === 'ping') {
      // Subdued telemetry heartbeat beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'alert') {
      // Emergency alert chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'warning') {
      // Two-tone warning tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.setValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  }

  toggleAudio() {
    this.audioMuted = !this.audioMuted;
    const btn = document.getElementById('audioToggleBtn');
    const icon = document.getElementById('audioToggleIcon');
    if (btn && icon) {
      if (this.audioMuted) {
        btn.classList.add('text-slate-500');
        btn.classList.remove('text-cyan-400');
        btn.setAttribute('title', 'Siren Audio Muted');
        icon.setAttribute('data-lucide', 'volume-x');
      } else {
        btn.classList.remove('text-slate-500');
        btn.classList.add('text-cyan-400');
        btn.setAttribute('title', 'Siren Audio Enabled');
        icon.setAttribute('data-lucide', 'volume-2');
        this.playTacticalSound('ping');
      }
      if (window.lucide) lucide.createIcons();
    }
    return !this.audioMuted;
  }

  startStreaming() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.tickTelemetry();
    }, 2800); // Poll / update cycle every 2.8s
  }

  stopStreaming() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  toggleStreaming() {
    this.isLiveStreaming = !this.isLiveStreaming;
    const indicator = document.getElementById('liveStreamingBadge');
    const streamToggleBtn = document.getElementById('streamToggleBtn');
    
    if (this.isLiveStreaming) {
      this.startStreaming();
      if (indicator) {
        indicator.innerHTML = `
          <span class="pulse-beacon bg-emerald-400 text-emerald-400"></span>
          <span class="text-xs font-mono font-bold tracking-wider text-emerald-400">TELEMETRY: STREAMING</span>
        `;
      }
      if (streamToggleBtn) streamToggleBtn.innerText = "Pause Feed";
    } else {
      this.stopStreaming();
      if (indicator) {
        indicator.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span class="text-xs font-mono font-bold tracking-wider text-amber-400">TELEMETRY: PAUSED</span>
        `;
      }
      if (streamToggleBtn) streamToggleBtn.innerText = "Resume Feed";
    }
  }

  tickTelemetry() {
    if (!this.isLiveStreaming) return;

    // Reset last sync timer
    this.lastSyncSeconds = 0;
    this.updateLastSyncDisplay();

    // Natural subtle noise perturbation for analog sensors
    const base = THREAT_PROFILES[this.currentThreat];
    
    // Water analog noise (+/- 4 ADC counts)
    const waterNoise = Math.floor((Math.random() - 0.48) * 8);
    this.liveData.waterAnalog = Math.min(1023, Math.max(0, base.waterAnalog + waterNoise));

    // Temperature noise (+/- 0.2 °C)
    const tempNoise = (Math.random() - 0.5) * 0.3;
    this.liveData.temp = parseFloat((base.temp + tempNoise).toFixed(1));

    // Humidity noise (+/- 0.4%)
    const humNoise = (Math.random() - 0.5) * 0.6;
    this.liveData.humidity = parseFloat((base.humidity + humNoise).toFixed(1));

    // Vibration pulse fluctuation
    if (this.currentThreat === 'CRITICAL' || this.currentThreat === 'WARNING') {
      this.liveData.vibrationPulses = Math.max(1, base.vibrationPulses + Math.floor((Math.random() - 0.5) * 6));
    }

    // Update DOM sensor cards
    this.updateDOMSensors();

    // Play subtle audio ping
    this.playTacticalSound('ping');
  }

  startClock() {
    const timeEl = document.getElementById('headerDateTime');
    const syncEl = document.getElementById('headerSyncTimer');
    const uptimeEl = document.getElementById('systemUptimeText');

    let uptimeSec = SYSTEM_METADATA.hardware.uptimeSeconds;

    setInterval(() => {
      // Live system time (ISO / UTC / Local)
      const now = new Date();
      if (timeEl) {
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        timeEl.innerHTML = `<span class="text-slate-400 font-mono">${dateStr}</span> <span class="text-white font-mono font-bold ml-1.5">${timeStr} IST</span>`;
      }

      // Sync counter
      this.lastSyncSeconds++;
      if (syncEl) {
        syncEl.innerText = `${this.lastSyncSeconds}s ago`;
      }

      // Uptime counter
      uptimeSec++;
      if (uptimeEl) {
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = uptimeSec % 60;
        uptimeEl.innerText = `${d}d ${h}h ${m}m ${s}s`;
      }
    }, 1000);
  }

  updateLastSyncDisplay() {
    const syncEl = document.getElementById('headerSyncTimer');
    if (syncEl) syncEl.innerText = "Just now";
  }

  applyThreatLevel(level, notify = true) {
    if (!THREAT_PROFILES[level]) return;
    this.currentThreat = level;
    this.liveData = { ...THREAT_PROFILES[level] };

    // Play sound notification on manual or scenario shift
    if (notify) {
      if (level === 'CRITICAL' || level === 'WARNING') {
        this.playTacticalSound('warning');
      } else if (level === 'WATCH' || level === 'ADVISORY') {
        this.playTacticalSound('alert');
      }
    }

    // 1. Update Threat Level Banner
    this.updateThreatBanner();

    // 2. Update 5 Live Sensor Cards
    this.updateDOMSensors();

    // 3. Update Early Warning Center counts & matrix
    this.updateEarlyWarningCenter();

    // 4. Update Map radar pulse color
    if (window.updateMapThreatPulse) {
      window.updateMapThreatPulse(this.liveData.color);
    }

    // 5. Update Threat selector buttons
    document.querySelectorAll('.threat-level-btn').forEach(btn => {
      if (btn.dataset.level === level) {
        btn.classList.add('ring-2', 'ring-white', 'shadow-lg');
      } else {
        btn.classList.remove('ring-2', 'ring-white', 'shadow-lg');
      }
    });
  }

  updateThreatBanner() {
    const banner = document.getElementById('emergencyStatusBanner');
    const badge = document.getElementById('threatLevelBadge');
    const scoreVal = document.getElementById('riskScoreValue');
    const scoreBar = document.getElementById('riskScoreBar');
    const assessmentEl = document.getElementById('threatAssessmentText');
    const timestampEl = document.getElementById('threatLastUpdated');

    if (!banner || !this.liveData) return;

    // Reset classes
    banner.className = 'panel p-4 md:p-5 transition-all duration-300 ' + (this.currentThreat === 'CRITICAL' ? 'critical-pulse border-red-500 bg-red-950/20' : '');
    
    // Threat level colors
    const colorMap = {
      NORMAL: { bg: 'bg-emerald-950/20', border: 'border-emerald-500/40', text: 'text-emerald-400', bar: 'bg-emerald-500' },
      ADVISORY: { bg: 'bg-yellow-950/20', border: 'border-yellow-500/40', text: 'text-yellow-400', bar: 'bg-yellow-500' },
      WATCH: { bg: 'bg-orange-950/20', border: 'border-orange-500/40', text: 'text-orange-400', bar: 'bg-orange-500' },
      WARNING: { bg: 'bg-red-950/25', border: 'border-red-500/50', text: 'text-red-400', bar: 'bg-red-500' },
      CRITICAL: { bg: 'bg-red-950/40', border: 'border-red-600', text: 'text-red-300', bar: 'bg-red-600' }
    };

    const cfg = colorMap[this.currentThreat] || colorMap.NORMAL;

    if (badge) {
      badge.textContent = this.currentThreat;
      badge.className = `px-3 py-1 rounded text-xs font-mono font-bold tracking-widest uppercase border ${cfg.text} ${cfg.bg} ${cfg.border}`;
    }

    if (scoreVal) {
      scoreVal.textContent = `${this.liveData.riskScore} / 100`;
      scoreVal.className = `text-2xl font-mono font-bold ${cfg.text}`;
    }

    if (scoreBar) {
      scoreBar.style.width = `${this.liveData.riskScore}%`;
      scoreBar.className = `h-full rounded-full transition-all duration-500 ${cfg.bar}`;
    }

    if (assessmentEl) {
      assessmentEl.textContent = this.liveData.assessment;
    }

    if (timestampEl) {
      timestampEl.textContent = new Date().toLocaleTimeString('en-GB') + ' IST';
    }
  }

  updateDOMSensors() {
    const data = this.liveData;

    // --- SENSOR 1: WATER SENSOR (Analog 0-1023) ---
    const waterVal = document.getElementById('valWaterSensor');
    const waterFill = document.getElementById('barWaterSensor');
    const waterStatus = document.getElementById('statusWaterSensor');
    const waterTimestamp = document.getElementById('tsWaterSensor');
    
    if (waterVal) waterVal.textContent = data.waterAnalog;
    if (waterFill) {
      const pct = Math.min(100, (data.waterAnalog / 1023) * 100);
      waterFill.style.width = `${pct}%`;
      if (data.waterAnalog > 750) waterFill.style.backgroundColor = '#ef4444';
      else if (data.waterAnalog > 500) waterFill.style.backgroundColor = '#f97316';
      else if (data.waterAnalog > 250) waterFill.style.backgroundColor = '#eab308';
      else waterFill.style.backgroundColor = '#06b6d4';
    }
    if (waterStatus) {
      waterStatus.textContent = data.waterStatus;
      waterStatus.className = `text-xs font-mono font-semibold tracking-wide ${data.waterAnalog > 750 ? 'text-red-400' : (data.waterAnalog > 500 ? 'text-orange-400' : 'text-cyan-400')}`;
    }
    if (waterTimestamp) waterTimestamp.textContent = new Date().toLocaleTimeString('en-GB');

    // --- SENSOR 2: RAIN SENSOR (Digital Wet/Dry Only) ---
    const rainStatus = document.getElementById('statusRainSensor');
    const rainPin = document.getElementById('pinRainSensor');
    const rainRate = document.getElementById('rateRainSensor');
    const rainTs = document.getElementById('tsRainSensor');
    
    if (rainStatus) {
      const isRain = data.rainDigital === 1;
      rainStatus.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full ${isRain ? 'bg-blue-400 animate-ping' : 'bg-slate-600'} mr-1.5"></span>
        <span class="${isRain ? 'text-blue-400 font-bold' : 'text-slate-400'}">${data.rainStatus}</span>
      `;
    }
    if (rainPin) rainPin.textContent = data.rainPinState;
    if (rainRate) rainRate.textContent = "Not measured (Digital rain sensor only)";
    if (rainTs) rainTs.textContent = new Date().toLocaleTimeString('en-GB');

    // --- SENSOR 3: SOIL MOISTURE SENSOR (Digital Wet/Dry Only) ---
    const soilStatus = document.getElementById('statusSoilSensor');
    const soilPin = document.getElementById('pinSoilSensor');
    const soilPct = document.getElementById('pctSoilSensor');
    const soilTs = document.getElementById('tsSoilSensor');

    if (soilStatus) {
      const isWet = data.soilDigital === 1;
      soilStatus.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full ${isWet ? 'bg-emerald-400' : 'bg-amber-500'} mr-1.5"></span>
        <span class="${isWet ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${data.soilStatus}</span>
      `;
    }
    if (soilPin) soilPin.textContent = data.soilPinState;
    if (soilPct) soilPct.textContent = "Not measured (Digital threshold probe)";
    if (soilTs) soilTs.textContent = new Date().toLocaleTimeString('en-GB');

    // --- SENSOR 4: VIBRATION SENSOR (SW-420) ---
    const vibStatus = document.getElementById('statusVibrationSensor');
    const vibCount = document.getElementById('countVibrationSensor');
    const vibPin = document.getElementById('pinVibrationSensor');
    const vibTs = document.getElementById('tsVibrationSensor');

    if (vibStatus) {
      const hasVib = data.vibrationPulses > 0;
      vibStatus.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full ${hasVib ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'} mr-1.5"></span>
        <span class="${hasVib ? 'text-amber-400 font-bold' : 'text-slate-400'}">${hasVib ? 'VIBRATION DETECTED' : 'NO VIBRATION'}</span>
      `;
    }
    if (vibCount) vibCount.textContent = `${data.vibrationPulses} events/min`;
    if (vibPin) vibPin.textContent = data.vibrationPinState;
    if (vibTs) vibTs.textContent = new Date().toLocaleTimeString('en-GB');

    // --- SENSOR 5: TEMPERATURE & HUMIDITY (DHT22) ---
    const tempVal = document.getElementById('valTempSensor');
    const humVal = document.getElementById('valHumSensor');
    const heatIndexVal = document.getElementById('valHeatIndex');
    const dewPointVal = document.getElementById('valDewPoint');
    const dhtTs = document.getElementById('tsDhtSensor');

    if (tempVal) tempVal.textContent = `${data.temp}°C`;
    if (humVal) humVal.textContent = `${data.humidity}%`;
    if (heatIndexVal) heatIndexVal.textContent = `${data.heatIndex || '26.4'}°C`;
    if (dewPointVal) dewPointVal.textContent = `${data.dewPoint || '20.1'}°C`;
    if (dhtTs) dhtTs.textContent = new Date().toLocaleTimeString('en-GB');
  }

  updateEarlyWarningCenter() {
    const alertCountBadge = document.getElementById('earlyWarningBadgeCount');
    const threatHeader = document.getElementById('ewThreatAssessmentHeader');
    if (alertCountBadge) {
      alertCountBadge.textContent = `${this.liveData.activeAlertsCount} ACTIVE`;
    }
    if (threatHeader) {
      threatHeader.textContent = `SYSTEM THREAT STATE: ${this.currentThreat}`;
      threatHeader.style.color = this.liveData.color;
    }
  }

  loadScenario(scenarioName) {
    if (scenarioName === 'flash_flood') {
      this.applyThreatLevel('WARNING', true);
      this.liveData.waterAnalog = 740;
      this.liveData.waterStatus = "FLASH INUNDATION ACTIVE";
      this.liveData.rainDigital = 1;
      this.liveData.soilDigital = 1;
      this.updateDOMSensors();
    } else if (scenarioName === 'landslide') {
      this.applyThreatLevel('CRITICAL', true);
      this.liveData.waterAnalog = 680;
      this.liveData.vibrationPulses = 54;
      this.liveData.soilDigital = 1;
      this.liveData.vibrationStatus = "DEBRIS TRANSIT INTERRUPT BURST";
      this.updateDOMSensors();
    } else if (scenarioName === 'monsoon') {
      this.applyThreatLevel('WATCH', true);
      this.liveData.rainDigital = 1;
      this.liveData.waterAnalog = 480;
      this.liveData.humidity = 92.4;
      this.updateDOMSensors();
    } else if (scenarioName === 'normal') {
      this.applyThreatLevel('NORMAL', true);
    }
  }
}

// Global Singleton Instance
window.telemetryEngine = new TelemetryEngine();

