import { getAdminVisitorData } from '../firebase/firestore.js';
import { logoutUser } from '../firebase/auth.js';

let navigateFn = null;
let visitorsData = [];
let allVisits = [];
let statsData = { totalVisitors: 0, newVisitors: 0, visitsToday: 0, returningVisitors: 0 };
let currentFilter = 'all';
let currentSort = 'lastVisitDesc';
let searchQuery = '';

export function initAdminUI(containerEl, onNavigate) {
  navigateFn = onNavigate;
}

export async function loadAndRenderAdmin(container) {
  if (!container) return;

  // Render initial loading state
  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-title-area">
        <h1>Visitor Analytics</h1>
        <p>Real-time authenticated visitor tracking & engagement</p>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm" id="admin-to-portfolio-btn">
          Back to Portfolio
        </button>
        <button class="btn btn-primary btn-sm" id="admin-logout-btn">
          Sign Out
        </button>
      </div>
    </div>

    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <div class="admin-stat-label">Total Visitors</div>
        <div class="admin-stat-val">—</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-label">New Visitors (7d)</div>
        <div class="admin-stat-val">—</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-label">Visits Today</div>
        <div class="admin-stat-val">—</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-label">Returning Visitors</div>
        <div class="admin-stat-val">—</div>
      </div>
    </div>

    <div class="admin-table-container">
      <div class="table-state-box">
        <div class="spinner spinner-light" style="margin: 0 auto 12px; width: 28px; height: 28px; border-width: 3px;"></div>
        <p>Loading visitor records from Firestore...</p>
      </div>
    </div>
  `;

  bindHeaderButtons(container);

  try {
    const data = await getAdminVisitorData();
    visitorsData = data.visitors;
    allVisits = data.visits;
    statsData = data.stats;
    renderFullDashboard(container);
  } catch (error) {
    console.error('Error loading admin visitor data:', error);
    renderErrorState(container, error.message);
  }
}

function renderFullDashboard(container) {
  const filteredVisitors = filterAndSortVisitors(visitorsData);

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-title-area">
        <h1>Visitor Analytics</h1>
        <p>Real-time authenticated visitor tracking & engagement</p>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm" id="admin-to-portfolio-btn">
          ← Back to Portfolio
        </button>
        <button class="btn btn-primary btn-sm" id="admin-logout-btn">
          Sign Out
        </button>
      </div>
    </div>

    <!-- Stats Overview Cards -->
    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <div class="admin-stat-label">Total Visitors</div>
        <div class="admin-stat-val">${statsData.totalVisitors}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-label">New Visitors (7d)</div>
        <div class="admin-stat-val">${statsData.newVisitors}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-label">Visits Today</div>
        <div class="admin-stat-val">${statsData.visitsToday}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-label">Returning Visitors</div>
        <div class="admin-stat-val">${statsData.returningVisitors}</div>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="admin-controls-card">
      <div class="admin-search-box">
        <svg class="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="admin-search-input" 
          placeholder="Search by visitor name or email..." 
          value="${escapeHtml(searchQuery)}"
        />
      </div>

      <div class="admin-filters">
        <select id="admin-provider-filter" class="admin-select" aria-label="Filter by provider">
          <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>All Providers</option>
          <option value="google" ${currentFilter === 'google' ? 'selected' : ''}>Google</option>
          <option value="github" ${currentFilter === 'github' ? 'selected' : ''}>GitHub</option>
          <option value="email" ${currentFilter === 'email' ? 'selected' : ''}>Email</option>
        </select>

        <select id="admin-sort-select" class="admin-select" aria-label="Sort visitors">
          <option value="lastVisitDesc" ${currentSort === 'lastVisitDesc' ? 'selected' : ''}>Last Visit (Newest)</option>
          <option value="lastVisitAsc" ${currentSort === 'lastVisitAsc' ? 'selected' : ''}>Last Visit (Oldest)</option>
          <option value="loginCountDesc" ${currentSort === 'loginCountDesc' ? 'selected' : ''}>Most Active (Login Count)</option>
          <option value="nameAsc" ${currentSort === 'nameAsc' ? 'selected' : ''}>Name (A–Z)</option>
        </select>
      </div>
    </div>

    <!-- Visitors Table -->
    <div class="admin-table-container">
      <div class="admin-table-responsive">
        ${renderVisitorTableContent(filteredVisitors)}
      </div>
    </div>
  `;

  bindHeaderButtons(container);
  bindControlEvents(container);
}

function renderVisitorTableContent(visitors) {
  if (visitors.length === 0) {
    return `
      <div class="table-state-box">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto; color: var(--text-muted);">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>No matching visitors found.</p>
      </div>
    `;
  }

  const rowsHtml = visitors.map(v => {
    const avatarContent = v.photoURL
      ? `<img src="${v.photoURL}" alt="" class="visitor-avatar" />`
      : `<div class="visitor-avatar">${getInitials(v.displayName || v.email)}</div>`;

    const providerClass = `provider-badge ${v.provider || 'email'}`;
    const firstVisit = formatTimestamp(v.createdAt);
    const lastVisit = formatRelativeTime(v.lastLoginAt);
    const loginCount = v.loginCount || 1;

    return `
      <tr>
        <td>
          <div class="visitor-cell">
            ${avatarContent}
            <div>
              <div class="visitor-name">${escapeHtml(v.displayName || 'Visitor')}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(v.email || 'No email')}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="${providerClass}">${v.provider || 'email'}</span>
        </td>
        <td>${firstVisit}</td>
        <td style="color: var(--gold-400); font-weight: 500;">${lastVisit}</td>
        <td>
          <span class="badge-count">${loginCount}</span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Visitor</th>
          <th>Provider</th>
          <th>First Visit</th>
          <th>Last Visit</th>
          <th>Login Count</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

function renderErrorState(container, errorMsg) {
  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-title-area">
        <h1>Visitor Analytics</h1>
        <p>Access restricted or Firestore error</p>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm" id="admin-to-portfolio-btn">Back to Portfolio</button>
      </div>
    </div>
    <div class="admin-table-container">
      <div class="table-state-box" style="color: #fca5a5;">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 10px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="font-weight: 600; font-size: 1.1rem; color: #f87171;">Unable to load visitor records</p>
        <p style="color: var(--text-secondary); max-width: 500px; margin: 8px auto 20px;">
          ${escapeHtml(errorMsg)}. Make sure your account has admin authorization in Firestore Security Rules.
        </p>
        <button class="btn btn-primary btn-sm" id="admin-retry-btn">Try Again</button>
      </div>
    </div>
  `;

  bindHeaderButtons(container);
  const retryBtn = container.querySelector('#admin-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadAndRenderAdmin(container));
  }
}

function bindHeaderButtons(container) {
  const toPortfolioBtn = container.querySelector('#admin-to-portfolio-btn');
  if (toPortfolioBtn) {
    toPortfolioBtn.addEventListener('click', () => {
      if (navigateFn) navigateFn('/');
    });
  }

  const logoutBtn = container.querySelector('#admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutUser();
      if (navigateFn) navigateFn('/login');
    });
  }
}

function bindControlEvents(container) {
  const searchInput = container.querySelector('#admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      updateTableOnly(container);
    });
  }

  const providerFilter = container.querySelector('#admin-provider-filter');
  if (providerFilter) {
    providerFilter.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      updateTableOnly(container);
    });
  }

  const sortSelect = container.querySelector('#admin-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      updateTableOnly(container);
    });
  }
}

function updateTableOnly(container) {
  const tableWrapper = container.querySelector('.admin-table-responsive');
  if (!tableWrapper) return;
  const filtered = filterAndSortVisitors(visitorsData);
  tableWrapper.innerHTML = renderVisitorTableContent(filtered);
}

function filterAndSortVisitors(visitors) {
  let result = [...visitors];

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(v => 
      (v.displayName && v.displayName.toLowerCase().includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q))
    );
  }

  // Provider filter
  if (currentFilter !== 'all') {
    result = result.filter(v => (v.provider || 'email') === currentFilter);
  }

  // Sorting
  result.sort((a, b) => {
    if (currentSort === 'lastVisitDesc') {
      const timeA = a.lastLoginAt?.toMillis ? a.lastLoginAt.toMillis() : 0;
      const timeB = b.lastLoginAt?.toMillis ? b.lastLoginAt.toMillis() : 0;
      return timeB - timeA;
    }
    if (currentSort === 'lastVisitAsc') {
      const timeA = a.lastLoginAt?.toMillis ? a.lastLoginAt.toMillis() : 0;
      const timeB = b.lastLoginAt?.toMillis ? b.lastLoginAt.toMillis() : 0;
      return timeA - timeB;
    }
    if (currentSort === 'loginCountDesc') {
      return (b.loginCount || 1) - (a.loginCount || 1);
    }
    if (currentSort === 'nameAsc') {
      return (a.displayName || '').localeCompare(b.displayName || '');
    }
    return 0;
  });

  return result;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never';
  const ms = timestamp.toMillis ? timestamp.toMillis() : (timestamp.seconds ? timestamp.seconds * 1000 : null);
  if (!ms) return 'Recently';

  const diffSeconds = Math.floor((Date.now() - ms) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  const ms = timestamp.toMillis ? timestamp.toMillis() : (timestamp.seconds ? timestamp.seconds * 1000 : null);
  if (!ms) return '—';
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
