/**
 * DISASTER WATCH - Enterprise Geographic Monitoring Engine
 * Interactive tactical map powered by Leaflet.js with Dark Matter CartoDB styling,
 * sensor mesh markers, flood risk polygons, elevation contours, and live station telemetry.
 */

let mapInstance = null;
let sensorMarkers = [];
let riskZoneLayers = [];

function initDisasterMap() {
  const mapElement = document.getElementById('tacticalMap');
  if (!mapElement || mapInstance) return;

  // Initialize centered on Western Ghats monitoring sector
  mapInstance = L.map('tacticalMap', {
    center: [11.6054, 76.0822],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
  });

  // Top-right custom zoom controls
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // High-contrast Dark Matter CartoDB tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(mapInstance);

  // 1. Environmental Monitoring Coverage Rings around Station Alpha-07
  const coreCoverage = L.circle([11.6054, 76.0822], {
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.08,
    weight: 1.5,
    dashArray: '4, 4',
    radius: 1200 // 1.2km core telemetry perimeter
  }).addTo(mapInstance);
  riskZoneLayers.push(coreCoverage);

  const meshCoverage = L.circle([11.6054, 76.0822], {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.03,
    weight: 1,
    dashArray: '6, 6',
    radius: 2800 // 2.8km ESP-NOW mesh relay perimeter
  }).addTo(mapInstance);
  riskZoneLayers.push(meshCoverage);

  // 2. High-Risk Flash Flood Runoff Corridor (Polygon)
  const floodCorridor = L.polygon([
    [11.6200, 76.0680],
    [11.6150, 76.0740],
    [11.6060, 76.0810],
    [11.5970, 76.0850],
    [11.5880, 76.0720],
    [11.5920, 76.0620],
    [11.6040, 76.0670],
    [11.6160, 76.0640]
  ], {
    color: '#0284c7',
    weight: 2,
    fillColor: '#0284c7',
    fillOpacity: 0.22,
    dashArray: '2, 3'
  }).addTo(mapInstance);
  floodCorridor.bindPopup(`
    <div class="p-2 font-sans text-xs">
      <div class="text-cyan-400 font-bold mb-1 tracking-wider uppercase">Chaliyar Sub-Basin Runoff Corridor</div>
      <div class="text-slate-300">High flash-flood susceptibility channel. Hydrological discharge transit time < 25 mins.</div>
    </div>
  `);
  riskZoneLayers.push(floodCorridor);

  // 3. Slope Instability & Landslide Susceptibility Zone (Polygon)
  const landslideZone = L.polygon([
    [11.6080, 76.0860],
    [11.6140, 76.0960],
    [11.6040, 76.1040],
    [11.5950, 76.0950],
    [11.5990, 76.0870]
  ], {
    color: '#dc2626',
    weight: 2,
    fillColor: '#dc2626',
    fillOpacity: 0.25,
    dashArray: '4, 4'
  }).addTo(mapInstance);
  landslideZone.bindPopup(`
    <div class="p-2 font-sans text-xs">
      <div class="text-red-400 font-bold mb-1 tracking-wider uppercase">Zone 4B Escarpment Slope Hazard</div>
      <div class="text-slate-300">Slope angle 28°-35°. Saturated soil combined with micro-tremors elevates shear failure risk.</div>
    </div>
  `);
  riskZoneLayers.push(landslideZone);

  // 4. Mesh Node Markers
  MESH_NODES.forEach(node => {
    let markerColor = '#10b981'; // normal
    let pulseHtml = '';
    
    if (node.threat === 'CRITICAL') markerColor = '#dc2626';
    else if (node.threat === 'WARNING') markerColor = '#ef4444';
    else if (node.threat === 'WATCH') markerColor = '#f97316';
    else if (node.threat === 'ADVISORY') markerColor = '#eab308';

    const isPrimary = node.id === 'ALPHA-07';
    if (isPrimary) {
      pulseHtml = `<div class="radar-sweep"></div>`;
    }

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer">
          ${pulseHtml}
          <div class="w-4 h-4 rounded-full border-2 border-slate-900 shadow-lg flex items-center justify-center" style="background-color: ${markerColor}">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider bg-slate-950/90 text-slate-200 border border-slate-700/80 pointer-events-none">
            ${node.id}
          </div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(mapInstance);

    const popupContent = `
      <div class="p-2 font-sans text-xs space-y-1.5 min-w-[210px]">
        <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span class="font-bold text-white tracking-wide">${node.name}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style="background-color: ${markerColor}22; color: ${markerColor}; border: 1px solid ${markerColor}66;">
            ${node.threat}
          </span>
        </div>
        <div class="text-[11px] text-slate-300">
          <div class="flex justify-between py-0.5"><span class="text-slate-400">Node Type:</span> <span>${node.type}</span></div>
          <div class="flex justify-between py-0.5"><span class="text-slate-400">Elevation:</span> <span class="font-mono">${node.elevation}</span></div>
          <div class="flex justify-between py-0.5"><span class="text-slate-400">Status:</span> <span class="text-emerald-400 font-bold">${node.status}</span></div>
          <div class="pt-1 text-[10px] text-slate-400 border-t border-slate-800">Sensors: ${node.sensors.join(', ')}</div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    sensorMarkers.push(marker);

    if (isPrimary) {
      marker.openPopup();
    }
  });

  // Re-fit map view on window resize
  window.addEventListener('resize', () => {
    if (mapInstance) mapInstance.invalidateSize();
  });
}

function updateMapThreatPulse(threatColor) {
  const radarSweep = document.querySelector('.radar-sweep');
  if (radarSweep) {
    radarSweep.style.borderColor = threatColor;
  }
}

