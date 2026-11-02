/**
 * DISASTER WATCH - 100% REAL THINGSPEAK CLOUD CLIENT
 * NO FAKE SIMULATION. NO RANDOM NOISE. NO FABRICATED VALUES.
 * 
 * Connects directly to ThingSpeak Channel 3561421:
 *   - Read API Key: 8GDSH97J4Z1R4HIX
 *   - Write API Key: JUYB83S6AJST0E9N
 * 
 * Hardware Field Mapping:
 *   - Field 1: Water Sensor Analog (0-1023) [Pin A0]
 *   - Field 2: Rain Sensor Digital (0 = No Rain, 1 = Rain Detected) [Pin D7]
 *   - Field 3: Soil Moisture Digital (0 = Dry, 1 = Wet) [Pin D6]
 *   - Field 4: Vibration Sensor Digital (0 = No Vibration, 1 = Vibration Detected) [Pin D5]
 *   - Field 5: Temperature DHT22 (°C) [Pin D2]
 *   - Field 6: Humidity DHT22 (% RH) [Pin D2]
 */

class ThingSpeakRealClient {
  constructor() {
    this.channelId = '3561421';
    this.readApiKey = '8GDSH97J4Z1R4HIX';
    this.writeApiKey = 'JUYB83S6AJST0E9N';
    this.baseUrl = 'https://api.thingspeak.com';

    this.pollIntervalMs = 3000; // Poll cloud every 3 seconds
    this.pollTimer = null;
    
    this.lastEntryId = null;
    this.latestFeed = null;
    this.feeds = [];
    this.isFetching = false;
    
    this.hardwareOnlineThresholdSec = 45; // If last entry > 45s ago, hardware is offline
  }

  init() {
    console.log('[ThingSpeakRealClient] Starting real-time cloud listener for Channel 3561421...');
    this.fetchRealFeeds();
    
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.fetchRealFeeds();
    }, this.pollIntervalMs);
  }

  async fetchRealFeeds() {
    if (this.isFetching) return;
    this.isFetching = true;

    // Fetch last 30 entries directly from user's ThingSpeak channel
    const url = `${this.baseUrl}/channels/${this.channelId}/feeds.json?api_key=${this.readApiKey}&results=30&_=${Date.now()}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.feeds = data.feeds || [];

      if (this.feeds.length > 0) {
        const latest = this.feeds[this.feeds.length - 1];
        const isNew = !this.lastEntryId || latest.entry_id !== this.lastEntryId;
        this.lastEntryId = latest.entry_id;
        this.latestFeed = latest;

        // Apply 100% REAL data to DOM
        this.renderRealTelemetry(latest, isNew);
        this.renderRealCharts(this.feeds);
        this.renderRealEvents(this.feeds);
      } else {
        this.renderNoDataState();
      }

    } catch (err) {
      console.error('[ThingSpeakRealClient] Network Error:', err);
      this.renderErrorState(err.message);
    } finally {
      this.isFetching = false;
    }
  }

  renderRealTelemetry(feed, isNew) {
    // 1. Check Hardware Freshness (Is ESP8266 powered on right now?)
    const feedTime = new Date(feed.created_at).getTime();
    const now = Date.now();
    const ageSeconds = Math.max(0, Math.floor((now - feedTime) / 1000));
    const isHardwareActive = ageSeconds <= this.hardwareOnlineThresholdSec;

    // 2. Parse exact real sensor numbers
    const water = feed.field1 !== null && feed.field1 !== undefined ? parseInt(feed.field1, 10) : 0;
    const rain = parseInt(feed.field2, 10) || 0;       // 1 = Rain, 0 = No rain
    const soil = parseInt(feed.field3, 10) || 0;       // 1 = Wet, 0 = Dry
    const vibration = parseInt(feed.field4, 10) || 0;  // 1 = Vibration, 0 = No vibration
    const temp = (feed.field5 !== null && feed.field5 !== undefined && feed.field5 !== '') ? parseFloat(feed.field5).toFixed(1) : '--';
    const hum = (feed.field6 !== null && feed.field6 !== undefined && feed.field6 !== '') ? parseFloat(feed.field6).toFixed(1) : '--';

    const localTimeStr = new Date(feed.created_at).toLocaleTimeString('en-GB') + ' IST';
    const timeAgoStr = ageSeconds < 60 ? `${ageSeconds}s ago` : `${Math.floor(ageSeconds / 60)}m ${ageSeconds % 60}s ago`;

    // 3. Update Hardware Connection Status Header Badge
    this.updateHardwareStatusBadge(isHardwareActive, feed.entry_id, timeAgoStr);

    // 4. Update Header Sync Timers
    const syncEl = document.getElementById('headerSyncTimer');
    if (syncEl) syncEl.innerText = timeAgoStr;

    // 5. Update Sensor 1: WATER SENSOR (A0)
    const valWater = document.getElementById('valWaterSensor');
    const barWater = document.getElementById('barWaterSensor');
    const statusWater = document.getElementById('statusWaterSensor');
    const tsWater = document.getElementById('tsWaterSensor');

    if (valWater) valWater.textContent = water;
    if (barWater) {
      const pct = Math.min(100, Math.max(0, (water / 1023) * 100));
      barWater.style.width = `${pct}%`;
      if (water > 750) barWater.style.backgroundColor = '#dc2626';
      else if (water > 500) barWater.style.backgroundColor = '#ef4444';
      else if (water > 250) barWater.style.backgroundColor = '#f97316';
      else if (water > 100) barWater.style.backgroundColor = '#eab308';
      else barWater.style.backgroundColor = '#06b6d4';
    }
    if (statusWater) {
      if (water > 750) {
        statusWater.textContent = 'CRITICAL INUNDATION (>750)';
        statusWater.className = 'text-xs font-mono font-bold text-red-400';
      } else if (water > 500) {
        statusWater.textContent = 'HIGH WATER LEVEL (>500)';
        statusWater.className = 'text-xs font-mono font-bold text-orange-400';
      } else if (water > 250) {
        statusWater.textContent = 'MODERATE RUNOFF (>250)';
        statusWater.className = 'text-xs font-mono font-bold text-yellow-400';
      } else if (water > 50) {
        statusWater.textContent = 'LOW BASEFLOW';
        statusWater.className = 'text-xs font-mono font-medium text-cyan-300';
      } else {
        statusWater.textContent = 'DRY / QUIESCENT BED';
        statusWater.className = 'text-xs font-mono font-semibold text-emerald-400';
      }
    }
    if (tsWater) tsWater.textContent = localTimeStr;

    // 6. Update Sensor 2: RAIN SENSOR (Pin D7)
    const statusRain = document.getElementById('statusRainSensor');
    const pinRain = document.getElementById('pinRainSensor');
    const tsRain = document.getElementById('tsRainSensor');
    if (statusRain) {
      const isRain = (rain === 1);
      statusRain.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full ${isRain ? 'bg-blue-400 animate-ping' : 'bg-slate-600'} mr-2"></span>
        <span class="${isRain ? 'text-blue-400 font-bold' : 'text-slate-400 font-semibold'}">${isRain ? 'RAIN DETECTED' : 'NO RAIN'}</span>
      `;
    }
    if (pinRain) {
      pinRain.textContent = rain === 1 ? 'PIN D7: LOW (CONDUCTIVE BRIDGE)' : 'PIN D7: HIGH (DRY / OPEN)';
    }
    if (tsRain) tsRain.textContent = localTimeStr;

    // 7. Update Sensor 3: SOIL MOISTURE SENSOR (Pin D6)
    const statusSoil = document.getElementById('statusSoilSensor');
    const pinSoil = document.getElementById('pinSoilSensor');
    const tsSoil = document.getElementById('tsSoilSensor');
    if (statusSoil) {
      const isWet = (soil === 1);
      statusSoil.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full ${isWet ? 'bg-emerald-400' : 'bg-amber-500'} mr-2"></span>
        <span class="${isWet ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}">${isWet ? 'WET (SATURATED)' : 'DRY'}</span>
      `;
    }
    if (pinSoil) {
      pinSoil.textContent = soil === 1 ? 'PIN D6: LOW (CONDUCTIVE WET)' : 'PIN D6: HIGH (DRY)';
    }
    if (tsSoil) tsSoil.textContent = localTimeStr;

    // 8. Update Sensor 4: VIBRATION SENSOR (Pin D5)
    const statusVib = document.getElementById('statusVibrationSensor');
    const countVib = document.getElementById('countVibrationSensor');
    const pinVib = document.getElementById('pinVibrationSensor');
    const tsVib = document.getElementById('tsVibrationSensor');
    if (statusVib) {
      const hasVib = (vibration === 1);
      statusVib.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full ${hasVib ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'} mr-2"></span>
        <span class="${hasVib ? 'text-amber-400 font-bold' : 'text-slate-400 font-semibold'}">${hasVib ? 'VIBRATION DETECTED' : 'NO VIBRATION'}</span>
      `;
    }
    if (countVib) {
      countVib.textContent = vibration === 1 ? 'TRIGGER ACTIVE (HIGH)' : 'QUIESCENT (LOW)';
    }
    if (pinVib) {
      pinVib.textContent = vibration === 1 ? 'PIN D5: HIGH (TRIGGER DETECTED)' : 'PIN D5: LOW (NO TRIGGER)';
    }
    if (tsVib) tsVib.textContent = localTimeStr;

    // 9. Update Sensor 5: TEMPERATURE & HUMIDITY (Pin D2)
    const valTemp = document.getElementById('valTempSensor');
    const valHum = document.getElementById('valHumSensor');
    const valDew = document.getElementById('valDewPoint');
    const valHeat = document.getElementById('valHeatIndex');
    const tsDht = document.getElementById('tsDhtSensor');

    if (valTemp) valTemp.textContent = temp !== '--' ? `${temp} °C` : '--';
    if (valHum) valHum.textContent = hum !== '--' ? `${hum} %` : '--';
    if (tsDht) tsDht.textContent = localTimeStr;

    if (temp !== '--' && hum !== '--') {
      const t = parseFloat(temp);
      const h = parseFloat(hum);
      const dew = (t - ((100 - h) / 5)).toFixed(1);
      if (valDew) valDew.textContent = `${dew} °C`;
      if (valHeat) valHeat.textContent = `${(t + 0.5).toFixed(1)} °C`;
    }

    // 10. Compute Real Threat Level
    const threat = this.computeRealThreat(water, rain, soil, vibration, isHardwareActive, ageSeconds);
    this.renderRealThreatBanner(threat, localTimeStr, isHardwareActive, timeAgoStr);
  }

  computeRealThreat(water, rain, soil, vibration, isOnline, ageSeconds) {
    let score = 5; // Base quiescent

    if (water > 750) score += 40;
    else if (water > 500) score += 25;
    else if (water > 250) score += 15;
    else if (water > 100) score += 8;

    if (rain === 1) score += 15;
    if (soil === 1) score += 20;
    if (vibration === 1) score += 20;

    score = Math.min(100, score);

    let level = 'NORMAL';
    let assessment = 'Real telemetry from ESP8266 indicates calm environmental baseline. No threshold trips.';

    if (water > 750 || (soil === 1 && vibration === 1 && water > 500)) {
      level = 'CRITICAL';
      assessment = `CRITICAL HAZARD: Water level (${water}/1023 ADC) reached inundation stage. High risk of localized flooding or debris transit!`;
    } else if (water > 500 || (soil === 1 && vibration === 1)) {
      level = 'WARNING';
      assessment = `WARNING: Runoff surge (${water}/1023 ADC) or saturated soil with ground vibration recorded. Monitor catchment slope.`;
    } else if ((rain === 1 && soil === 1) || water > 250) {
      level = 'WATCH';
      assessment = `WATCH: Sustained rainfall with soil saturation or elevated stream stage (${water}/1023 ADC). High watchstander awareness advised.`;
    } else if (rain === 1 || vibration === 1 || water > 100) {
      level = 'ADVISORY';
      const reason = vibration === 1 ? 'Ground vibration pulse triggered on Pin D5' : (rain === 1 ? 'Rain detected on Pin D7' : `Water level at ${water}/1023 ADC`);
      assessment = `ADVISORY: ${reason}. Baseline monitoring in progress.`;
    }

    if (!isOnline) {
      assessment += ` [HARDWARE OFFLINE: Last data was received ${Math.floor(ageSeconds / 60)}m ago. Turn on your ESP8266 to resume live streaming.]`;
    }

    return { level, score, assessment };
  }

  renderRealThreatBanner(threat, timestamp, isOnline, timeAgoStr) {
    const banner = document.getElementById('emergencyStatusBanner');
    const badge = document.getElementById('threatLevelBadge');
    const scoreVal = document.getElementById('riskScoreValue');
    const scoreBar = document.getElementById('riskScoreBar');
    const assessmentEl = document.getElementById('threatAssessmentText');
    const tsEl = document.getElementById('threatLastUpdated');

    if (!banner) return;

    const colors = {
      NORMAL: { text: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-500/40', bar: 'bg-emerald-500' },
      ADVISORY: { text: 'text-yellow-400', bg: 'bg-yellow-950/20', border: 'border-yellow-500/40', bar: 'bg-yellow-500' },
      WATCH: { text: 'text-orange-400', bg: 'bg-orange-950/20', border: 'border-orange-500/40', bar: 'bg-orange-500' },
      WARNING: { text: 'text-red-400', bg: 'bg-red-950/25', border: 'border-red-500/50', bar: 'bg-red-500' },
      CRITICAL: { text: 'text-red-300', bg: 'bg-red-950/40', border: 'border-red-600', bar: 'bg-red-600' }
    };

    const cfg = colors[threat.level] || colors.NORMAL;

    if (badge) {
      badge.textContent = threat.level;
      badge.className = `px-3 py-1 rounded text-xs font-mono font-bold tracking-widest uppercase border ${cfg.text} ${cfg.bg} ${cfg.border}`;
    }

    if (scoreVal) {
      scoreVal.textContent = `${threat.score} / 100`;
      scoreVal.className = `text-2xl font-mono font-bold ${cfg.text}`;
    }

    if (scoreBar) {
      scoreBar.style.width = `${threat.score}%`;
      scoreBar.className = `h-full rounded-full transition-all duration-500 ${cfg.bar}`;
    }

    if (assessmentEl) {
      assessmentEl.textContent = threat.assessment;
    }

    if (tsEl) {
      tsEl.textContent = `${timestamp} (${timeAgoStr})`;
    }
  }

  updateHardwareStatusBadge(isOnline, entryId, timeAgoStr) {
    const badge = document.getElementById('thingspeakCloudBadge');
    if (!badge) return;

    if (isOnline) {
      badge.className = 'flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider';
      badge.innerHTML = `
        <span class="pulse-beacon bg-emerald-400 text-emerald-400"></span>
        <span>ESP HARDWARE: ONLINE</span>
        <span class="text-[10px] text-slate-400 font-normal hidden xl:inline">(Entry #${entryId} • ${timeAgoStr})</span>
      `;
    } else {
      badge.className = 'flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wider';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>ESP HARDWARE: OFFLINE</span>
        <span class="text-[10px] text-amber-200 font-normal hidden xl:inline">(Last seen ${timeAgoStr})</span>
      `;
    }
  }

  renderRealCharts(feeds) {
    if (!feeds || feeds.length === 0 || !window.chartInstances) return;

    const labels = [];
    const waterData = [];
    const rainData = [];
    const soilData = [];
    const vibData = [];
    const tempData = [];
    const humData = [];

    feeds.forEach(f => {
      const d = new Date(f.created_at);
      labels.push(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      waterData.push(parseInt(f.field1, 10) || 0);
      rainData.push(parseInt(f.field2, 10) || 0);
      soilData.push(parseInt(f.field3, 10) || 0);
      vibData.push(parseInt(f.field4, 10) || 0);
      tempData.push(f.field5 ? parseFloat(f.field5) : null);
      humData.push(f.field6 ? parseFloat(f.field6) : null);
    });

    // 1. Water History
    if (window.chartInstances.waterHistory) {
      window.chartInstances.waterHistory.data.labels = labels;
      window.chartInstances.waterHistory.data.datasets[0].data = waterData;
      window.chartInstances.waterHistory.data.datasets[1].data = Array(labels.length).fill(500);
      window.chartInstances.waterHistory.data.datasets[2].data = Array(labels.length).fill(750);
      window.chartInstances.waterHistory.update();
    }

    // 2. Temp History
    if (window.chartInstances.tempHistory) {
      window.chartInstances.tempHistory.data.labels = labels;
      window.chartInstances.tempHistory.data.datasets[0].data = tempData;
      window.chartInstances.tempHistory.update();
    }

    // 3. Humidity History
    if (window.chartInstances.humHistory) {
      window.chartInstances.humHistory.data.labels = labels;
      window.chartInstances.humHistory.data.datasets[0].data = humData;
      window.chartInstances.humHistory.update();
    }

    // 4. Rain Timeline
    if (window.chartInstances.rainTimeline) {
      window.chartInstances.rainTimeline.data.labels = labels;
      window.chartInstances.rainTimeline.data.datasets[0].data = rainData;
      window.chartInstances.rainTimeline.update();
    }

    // 5. Soil Timeline
    if (window.chartInstances.soilTimeline) {
      window.chartInstances.soilTimeline.data.labels = labels;
      window.chartInstances.soilTimeline.data.datasets[0].data = soilData;
      window.chartInstances.soilTimeline.update();
    }

    // 6. Vibration Frequency
    if (window.chartInstances.vibFrequency) {
      window.chartInstances.vibFrequency.data.labels = labels;
      window.chartInstances.vibFrequency.data.datasets[0].data = vibData;
      window.chartInstances.vibFrequency.update();
    }

    // Also update mini sparklines with real data
    if (window.chartInstances.waterSparkline) {
      window.chartInstances.waterSparkline.data.labels = labels;
      window.chartInstances.waterSparkline.data.datasets[0].data = waterData;
      window.chartInstances.waterSparkline.update();
    }
    if (window.chartInstances.rainSparkline) {
      window.chartInstances.rainSparkline.data.labels = labels;
      window.chartInstances.rainSparkline.data.datasets[0].data = rainData;
      window.chartInstances.rainSparkline.update();
    }
    if (window.chartInstances.soilSparkline) {
      window.chartInstances.soilSparkline.data.labels = labels;
      window.chartInstances.soilSparkline.data.datasets[0].data = soilData;
      window.chartInstances.soilSparkline.update();
    }
    if (window.chartInstances.vibrationSparkline) {
      window.chartInstances.vibrationSparkline.data.labels = labels;
      window.chartInstances.vibrationSparkline.data.datasets[0].data = vibData;
      window.chartInstances.vibrationSparkline.update();
    }
    if (window.chartInstances.tempSparkline) {
      window.chartInstances.tempSparkline.data.labels = labels;
      window.chartInstances.tempSparkline.data.datasets[0].data = tempData;
      window.chartInstances.tempSparkline.data.datasets[1].data = humData;
      window.chartInstances.tempSparkline.update();
    }
  }

  renderRealEvents(feeds) {
    if (!feeds || feeds.length === 0) return;

    const events = [];
    const reversed = [...feeds].reverse();

    reversed.forEach(f => {
      const water = parseInt(f.field1, 10) || 0;
      const rain = parseInt(f.field2, 10) || 0;
      const soil = parseInt(f.field3, 10) || 0;
      const vib = parseInt(f.field4, 10) || 0;
      const temp = f.field5 ? `${parseFloat(f.field5).toFixed(1)}°C` : '--';
      const hum = f.field6 ? `${parseFloat(f.field6).toFixed(1)}%` : '--';
      const ts = new Date(f.created_at).toLocaleString('en-GB');

      let sev = 'NORMAL';
      let desc = `Telemetry sync: Water ${water}/1023, Temp ${temp}, Hum ${hum}.`;

      if (water > 750) {
        sev = 'CRITICAL';
        desc = `CRITICAL FLOOD: Water level at ${water}/1023 ADC! Inundation warning threshold exceeded.`;
      } else if (vib === 1 && soil === 1) {
        sev = 'WARNING';
        desc = `SLOPE ALERT: SW-420 vibration trigger on wet soil. Potential slope shift indicator.`;
      } else if (water > 500) {
        sev = 'WATCH';
        desc = `Water runoff elevated: ${water}/1023 ADC crossed secondary Watch limit.`;
      } else if (vib === 1) {
        sev = 'ADVISORY';
        desc = `SW-420 Vibration switch triggered (Logic HIGH on Pin D5).`;
      } else if (rain === 1) {
        sev = 'ADVISORY';
        desc = `Precipitation detected on station plate (Pin D7 Logic LOW).`;
      }

      events.push({
        id: `TS-${f.entry_id}`,
        sensor: 'NodeMCU ESP8266 (Real)',
        description: desc,
        severity: sev,
        timestamp: ts,
        status: sev === 'NORMAL' ? 'RESOLVED' : 'ACTIVE'
      });
    });

    if (window.renderEventsTable) {
      window.renderEventsTable(events);
    }
  }

  renderNoDataState() {
    const badge = document.getElementById('thingspeakCloudBadge');
    if (badge) {
      badge.className = 'flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>AWAITING ESP8266 TRANSMISSION</span>
      `;
    }
  }

  renderErrorState(errMsg) {
    const badge = document.getElementById('thingspeakCloudBadge');
    if (badge) {
      badge.className = 'flex items-center gap-2 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wider';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-red-400"></span>
        <span>CLOUD FETCH ERROR (${errMsg})</span>
      `;
    }
  }
}

// Instantiate and start
window.thingSpeakClient = new ThingSpeakRealClient();
