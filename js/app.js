/**
 * DISASTER WATCH - Application Core Controller
 * Handles view switching, navigation state, sidebar collapsing,
 * event table search & filtering, notifications popover, and emergency actions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Telemetry Engine & Real ThingSpeak Client
  if (window.telemetryEngine) {
    window.telemetryEngine.init();
  }
  if (window.thingSpeakClient) {
    window.thingSpeakClient.init();
  }

  // 2. Initialize Charts
  if (window.initMiniSparklines) window.initMiniSparklines();
  if (window.initAnalyticsCharts) window.initAnalyticsCharts('1h');

  // 3. Initialize Tactical Map
  if (window.initDisasterMap) window.initDisasterMap();

  // 4. Render Initial Events Table (Awaiting Real ThingSpeak Cloud Data)
  renderEventsTable([]);

  // 5. Initialize Hardware Pin Table
  renderHardwarePinsTable();

  // 6. Setup Navigation View Switching
  setupNavigation();

  // 7. Setup Sidebar Collapse / Expand
  setupSidebar();

  // 8. Setup Table Filter & Search Listeners
  setupTableFilters();

  // 9. Setup Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Switch active view according to selected sidebar navigation item or mobile bottom nav
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-view]');
  const viewSections = document.querySelectorAll('.dashboard-view');

  function switchView(targetView) {
    // 1. Update sidebar nav items
    navItems.forEach(nav => {
      if (nav.dataset.view === targetView) {
        nav.classList.add('bg-blue-600/20', 'text-sky-400', 'border-sky-500', 'font-semibold');
        nav.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/40');
      } else {
        nav.classList.remove('bg-blue-600/20', 'text-sky-400', 'border-sky-500', 'font-semibold');
        nav.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/40');
      }
    });

    // 2. Update mobile bottom navigation buttons
    mobileNavBtns.forEach(btn => {
      if (btn.dataset.view === targetView) {
        btn.classList.add('active', 'text-sky-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'text-sky-400');
        btn.classList.add('text-slate-400');
      }
    });

    // 3. Update view visibility
    viewSections.forEach(section => {
      if (section.id === `view-${targetView}`) {
        section.classList.remove('hidden');
        if (targetView === 'overview' || targetView === 'geographic') {
          setTimeout(() => {
            if (window.mapInstance) window.mapInstance.invalidateSize();
          }, 100);
        }
      } else {
        section.classList.add('hidden');
      }
    });

    // 4. Update top bar breadcrumb
    const viewBreadcrumb = document.getElementById('currentViewBreadcrumb');
    if (viewBreadcrumb) {
      const activeNav = document.querySelector(`.sidebar-nav-item[data-view="${targetView}"]`);
      viewBreadcrumb.textContent = activeNav?.querySelector('.nav-label')?.textContent || targetView.toUpperCase();
    }

    // Scroll to top of view
    const mainArea = document.getElementById('mainContentArea');
    if (mainArea) mainArea.scrollTop = 0;
  }

  // Bind Sidebar Items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.dataset.view);

      // Close mobile drawer if open
      const sidebar = document.getElementById('mainSidebar');
      if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
        toggleSidebarMobile();
      }
    });
  });

  // Bind Mobile Bottom Nav Buttons
  mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(btn.dataset.view);
    });
  });
}

/**
 * Collapsible sidebar setup
 */
function setupSidebar() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const mobileToggleBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('mainSidebar');
  const mainContent = document.getElementById('mainContentArea');
  const navLabels = document.querySelectorAll('.nav-label');
  const brandSubtext = document.getElementById('brandSubtext');

  let isCollapsed = false;

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        if (mainContent) {
          mainContent.classList.remove('lg:pl-64');
          mainContent.classList.add('lg:pl-20');
        }
        navLabels.forEach(lbl => lbl.classList.add('hidden'));
        if (brandSubtext) brandSubtext.classList.add('hidden');
      } else {
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        if (mainContent) {
          mainContent.classList.remove('lg:pl-20');
          mainContent.classList.add('lg:pl-64');
        }
        navLabels.forEach(lbl => lbl.classList.remove('hidden'));
        if (brandSubtext) brandSubtext.classList.remove('hidden');
      }
    });
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', toggleSidebarMobile);
  }
}

function toggleSidebarMobile() {
  const sidebar = document.getElementById('mainSidebar');
  const backdrop = document.getElementById('sidebarMobileBackdrop');
  if (sidebar) {
    sidebar.classList.toggle('-translate-x-full');
  }
  if (backdrop) {
    backdrop.classList.toggle('hidden');
  }
}

/**
 * Filter and Search in Recent Events Table
 */
function setupTableFilters() {
  const searchInput = document.getElementById('eventSearchInput');
  const severityFilter = document.getElementById('eventSeverityFilter');
  const sensorFilter = document.getElementById('eventSensorFilter');

  function applyFilters() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const severity = severityFilter?.value || 'ALL';
    const sensor = sensorFilter?.value || 'ALL';

    const filtered = RECENT_EVENTS.filter(evt => {
      const matchQuery = !q || 
        evt.id.toLowerCase().includes(q) || 
        evt.sensor.toLowerCase().includes(q) || 
        evt.description.toLowerCase().includes(q);
      
      const matchSeverity = (severity === 'ALL') || (evt.severity === severity);
      const matchSensor = (sensor === 'ALL') || (evt.sensor.toLowerCase().includes(sensor.toLowerCase()));

      return matchQuery && matchSeverity && matchSensor;
    });

    renderEventsTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (severityFilter) severityFilter.addEventListener('change', applyFilters);
  if (sensorFilter) sensorFilter.addEventListener('change', applyFilters);
}

function renderEventsTable(events) {
  window.renderEventsTable = renderEventsTable;
  const tbody = document.getElementById('recentEventsTbody');
  const countEl = document.getElementById('eventsCountBadge');
  if (!tbody) return;

  if (countEl) countEl.textContent = `${events.length} records`;

  if (events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-slate-500 font-mono text-xs">
          Connecting to ThingSpeak Channel 3561421... Waiting for real telemetry packets from ESP8266.
        </td>
      </tr>
    `;
    return;
  }

  const severityBadges = {
    NORMAL: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    ADVISORY: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    WATCH: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    WARNING: 'bg-red-500/15 text-red-400 border border-red-500/30',
    CRITICAL: 'bg-red-600/30 text-red-300 border border-red-600 font-bold'
  };

  const statusBadges = {
    ACTIVE: 'text-red-400 font-bold flex items-center gap-1.5',
    ACKNOWLEDGED: 'text-amber-400 flex items-center gap-1.5',
    RESOLVED: 'text-slate-400 flex items-center gap-1.5'
  };

  tbody.innerHTML = events.map(evt => `
    <tr class="hover:bg-slate-800/30 transition-colors">
      <td class="font-mono text-sky-400 font-semibold text-xs whitespace-nowrap">${evt.id}</td>
      <td class="font-medium text-slate-200 text-xs whitespace-nowrap">${evt.sensor}</td>
      <td class="text-xs text-slate-300 max-w-md">${evt.description}</td>
      <td class="whitespace-nowrap">
        <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${severityBadges[evt.severity] || severityBadges.NORMAL}">
          ${evt.severity}
        </span>
      </td>
      <td class="font-mono text-slate-400 text-xs whitespace-nowrap">${evt.timestamp}</td>
      <td class="whitespace-nowrap">
        <span class="text-xs font-mono ${statusBadges[evt.status] || ''}">
          <span class="w-1.5 h-1.5 rounded-full ${evt.status === 'ACTIVE' ? 'bg-red-400 animate-ping' : (evt.status === 'ACKNOWLEDGED' ? 'bg-amber-400' : 'bg-slate-500')}"></span>
          ${evt.status}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderHardwarePinsTable() {
  const tbody = document.getElementById('hardwarePinsTbody');
  if (!tbody || !SYSTEM_METADATA.pins) return;

  tbody.innerHTML = SYSTEM_METADATA.pins.map(pin => `
    <tr class="hover:bg-slate-800/20">
      <td class="font-mono font-bold text-sky-400 text-xs">${pin.pin}</td>
      <td class="font-mono text-slate-400 text-xs">${pin.gpio}</td>
      <td class="text-slate-200 text-xs font-medium">${pin.sensor}</td>
      <td class="font-mono text-slate-400 text-[11px]">${pin.type}</td>
      <td class="font-mono text-slate-400 text-[11px]">${pin.sampleRate}</td>
      <td>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${pin.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}">
          ${pin.status}
        </span>
      </td>
    </tr>
  `).join('');
}

/**
 * Export simulated CSV of recent events
 */
function exportEventsCSV() {
  let csv = "Event ID,Sensor,Description,Severity,Timestamp,Status\n";
  RECENT_EVENTS.forEach(row => {
    csv += `"${row.id}","${row.sensor}","${row.description.replace(/"/g, '""')}","${row.severity}","${row.timestamp}","${row.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `disaster_watch_events_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Toggle Notifications dropdown popover
 */
function toggleNotificationsPopover() {
  const popover = document.getElementById('notificationsPopover');
  if (popover) {
    popover.classList.toggle('hidden');
  }
}

/**
 * Close modal dialogs
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

/**
 * Acknowledge all active alerts
 */
function acknowledgeActiveAlerts() {
  RECENT_EVENTS.forEach(evt => {
    if (evt.status === 'ACTIVE') evt.status = 'ACKNOWLEDGED';
  });
  renderEventsTable(RECENT_EVENTS);
  const badge = document.getElementById('earlyWarningBadgeCount');
  if (badge) badge.textContent = "0 ACTIVE";
  alert("All active early warning triggers have been formally ACKNOWLEDGED by Shift Commander.");
}

