/**
 * DISASTER WATCH - Professional Chart.js Telemetry Configurations
 * Enterprise dark mode styling, custom tooltips, gridlines, and thresholds.
 */

// Global Chart.js defaults
if (window.Chart) {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
  Chart.defaults.plugins.tooltip.backgroundColor = '#0b1325';
  Chart.defaults.plugins.tooltip.titleColor = '#f8fafc';
  Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
  Chart.defaults.plugins.tooltip.borderColor = '#1e293b';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
}

let chartInstances = {};

function initMiniSparklines() {
  const commonSparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0, hoverRadius: 4 },
      line: { tension: 0.3, borderWidth: 2 }
    }
  };

  // Water Sparkline
  const waterCtx = document.getElementById('waterSparkline');
  if (waterCtx) {
    chartInstances.waterSparkline = new Chart(waterCtx, {
      type: 'line',
      data: {
        labels: HISTORICAL_DATA['1h'].labels,
        datasets: [{
          data: HISTORICAL_DATA['1h'].waterAnalog,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          fill: true
        }]
      },
      options: {
        ...commonSparklineOptions,
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 1023 }
        }
      }
    });
  }

  // Rain Sparkline (Stepped digital)
  const rainCtx = document.getElementById('rainSparkline');
  if (rainCtx) {
    chartInstances.rainSparkline = new Chart(rainCtx, {
      type: 'line',
      data: {
        labels: HISTORICAL_DATA['1h'].labels,
        datasets: [{
          data: HISTORICAL_DATA['1h'].rainDigital,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          stepped: true,
          fill: true
        }]
      },
      options: {
        ...commonSparklineOptions,
        scales: {
          x: { display: false },
          y: { display: false, min: -0.1, max: 1.2 }
        }
      }
    });
  }

  // Soil Sparkline (Stepped digital)
  const soilCtx = document.getElementById('soilSparkline');
  if (soilCtx) {
    chartInstances.soilSparkline = new Chart(soilCtx, {
      type: 'line',
      data: {
        labels: HISTORICAL_DATA['1h'].labels,
        datasets: [{
          data: HISTORICAL_DATA['1h'].soilDigital,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          stepped: true,
          fill: true
        }]
      },
      options: {
        ...commonSparklineOptions,
        scales: {
          x: { display: false },
          y: { display: false, min: -0.1, max: 1.2 }
        }
      }
    });
  }

  // Vibration Sparkline (Bar pulse events)
  const vibCtx = document.getElementById('vibrationSparkline');
  if (vibCtx) {
    chartInstances.vibrationSparkline = new Chart(vibCtx, {
      type: 'bar',
      data: {
        labels: HISTORICAL_DATA['1h'].labels,
        datasets: [{
          data: HISTORICAL_DATA['1h'].vibrationPulses,
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          hoverBackgroundColor: '#f59e0b',
          borderRadius: 2
        }]
      },
      options: commonSparklineOptions
    });
  }

  // Temp & Humidity Mini Sparkline
  const tempCtx = document.getElementById('tempSparkline');
  if (tempCtx) {
    chartInstances.tempSparkline = new Chart(tempCtx, {
      type: 'line',
      data: {
        labels: HISTORICAL_DATA['1h'].labels,
        datasets: [{
          data: HISTORICAL_DATA['1h'].temp,
          borderColor: '#f43f5e',
          backgroundColor: 'transparent',
          borderWidth: 1.8
        }, {
          data: HISTORICAL_DATA['1h'].humidity,
          borderColor: '#38bdf8',
          backgroundColor: 'transparent',
          borderWidth: 1.8,
          borderDash: [3, 3]
        }]
      },
      options: commonSparklineOptions
    });
  }
}

/**
 * Initializes the 6 major analytical charts in the Advanced Data Visualization section
 */
function initAnalyticsCharts(timeRange = '1h') {
  const data = HISTORICAL_DATA[timeRange];
  if (!data) return;

  const baseAxisConfig = {
    grid: { color: 'rgba(255, 255, 255, 0.04)' },
    ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
  };

  // 1. Water Analog History (0-1023)
  const waterHistCtx = document.getElementById('chartWaterHistory');
  if (waterHistCtx) {
    if (chartInstances.waterHistory) chartInstances.waterHistory.destroy();
    chartInstances.waterHistory = new Chart(waterHistCtx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Water Level (0-1023 ADC)',
            data: data.waterAnalog,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.2,
            pointBackgroundColor: '#06b6d4',
            pointRadius: 3
          },
          {
            label: 'Watch Threshold (500)',
            data: Array(data.labels.length).fill(500),
            borderColor: 'rgba(249, 115, 22, 0.6)',
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Warning Threshold (750)',
            data: Array(data.labels.length).fill(750),
            borderColor: 'rgba(239, 68, 68, 0.65)',
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} ADC (0-1023)`
            }
          }
        },
        scales: {
          x: baseAxisConfig,
          y: {
            ...baseAxisConfig,
            min: 0,
            max: 1023,
            title: { display: true, text: 'Analog Value (0-1023)', color: '#64748b', font: { size: 10 } }
          }
        }
      }
    });
  }

  // 2. Temperature History (°C)
  const tempHistCtx = document.getElementById('chartTempHistory');
  if (tempHistCtx) {
    if (chartInstances.tempHistory) chartInstances.tempHistory.destroy();
    chartInstances.tempHistory = new Chart(tempHistCtx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Ambient Temperature (°C)',
          data: data.temp,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#f43f5e',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Temp: ${ctx.raw}°C`
            }
          }
        },
        scales: {
          x: baseAxisConfig,
          y: {
            ...baseAxisConfig,
            title: { display: true, text: 'Temperature (°C)', color: '#64748b', font: { size: 10 } }
          }
        }
      }
    });
  }

  // 3. Humidity History (% RH)
  const humHistCtx = document.getElementById('chartHumidityHistory');
  if (humHistCtx) {
    if (chartInstances.humHistory) chartInstances.humHistory.destroy();
    chartInstances.humHistory = new Chart(humHistCtx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Relative Humidity (% RH)',
          data: data.humidity,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#38bdf8',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Humidity: ${ctx.raw}% RH`
            }
          }
        },
        scales: {
          x: baseAxisConfig,
          y: {
            ...baseAxisConfig,
            min: 40,
            max: 100,
            title: { display: true, text: 'Relative Humidity (%)', color: '#64748b', font: { size: 10 } }
          }
        }
      }
    });
  }

  // 4. Rain Detection Timeline (Digital stepped)
  const rainHistCtx = document.getElementById('chartRainTimeline');
  if (rainHistCtx) {
    if (chartInstances.rainTimeline) chartInstances.rainTimeline.destroy();
    chartInstances.rainTimeline = new Chart(rainHistCtx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Digital Rain Detection (0: No Rain, 1: Rain Detected)',
          data: data.rainDigital,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          stepped: 'before',
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: (ctx) => ctx.raw === 1 ? '#38bdf8' : '#1e293b',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw === 1 ? 'Rain Detected (Pin LOW)' : 'No Rain (Pin HIGH)'
            }
          }
        },
        scales: {
          x: baseAxisConfig,
          y: {
            ...baseAxisConfig,
            min: -0.1,
            max: 1.1,
            ticks: {
              stepSize: 1,
              callback: (val) => val === 1 ? 'RAIN DETECTED' : (val === 0 ? 'NO RAIN' : '')
            }
          }
        }
      }
    });
  }

  // 5. Soil Wet/Dry History (Digital stepped)
  const soilHistCtx = document.getElementById('chartSoilTimeline');
  if (soilHistCtx) {
    if (chartInstances.soilTimeline) chartInstances.soilTimeline.destroy();
    chartInstances.soilTimeline = new Chart(soilHistCtx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Digital Soil Moisture State (0: Dry, 1: Wet)',
          data: data.soilDigital,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          stepped: 'before',
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: (ctx) => ctx.raw === 1 ? '#10b981' : '#1e293b',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw === 1 ? 'Soil State: WET (Pin HIGH)' : 'Soil State: DRY (Pin LOW)'
            }
          }
        },
        scales: {
          x: baseAxisConfig,
          y: {
            ...baseAxisConfig,
            min: -0.1,
            max: 1.1,
            ticks: {
              stepSize: 1,
              callback: (val) => val === 1 ? 'WET' : (val === 0 ? 'DRY' : '')
            }
          }
        }
      }
    });
  }

  // 6. Vibration Event Frequency (Bar Chart)
  const vibHistCtx = document.getElementById('chartVibrationFrequency');
  if (vibHistCtx) {
    if (chartInstances.vibFrequency) chartInstances.vibFrequency.destroy();
    chartInstances.vibFrequency = new Chart(vibHistCtx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'SW-420 Trigger Pulses',
          data: data.vibrationPulses,
          backgroundColor: (ctx) => {
            const val = ctx.raw;
            if (val > 10) return 'rgba(239, 68, 68, 0.85)';
            if (val > 3) return 'rgba(249, 115, 22, 0.85)';
            return 'rgba(245, 158, 11, 0.65)';
          },
          borderWidth: 1,
          borderColor: '#f59e0b',
          borderRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Vibration Events: ${ctx.raw} pulses/window`
            }
          }
        },
        scales: {
          x: baseAxisConfig,
          y: {
            ...baseAxisConfig,
            beginAtZero: true,
            title: { display: true, text: 'Pulses / Interval', color: '#64748b', font: { size: 10 } }
          }
        }
      }
    });
  }
}

// Global hook to update charts with active time range
function setChartTimeFilter(range) {
  document.querySelectorAll('.time-filter-btn').forEach(btn => {
    if (btn.dataset.range === range) {
      btn.classList.add('bg-blue-600', 'text-white', 'border-blue-500');
      btn.classList.remove('bg-slate-900', 'text-slate-400', 'border-slate-800');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-500');
      btn.classList.add('bg-slate-900', 'text-slate-400', 'border-slate-800');
    }
  });
  initAnalyticsCharts(range);
}

