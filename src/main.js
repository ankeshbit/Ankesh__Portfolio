import '../styles.css';
import './auth/auth-styles.css';
import { subscribeToAuth, logoutUser, checkIsAdmin } from './firebase/auth.js';
import { isFirebaseConfigured } from './firebase/config.js';
import { initAuthUI, setAuthMode } from './auth/auth-ui.js';
import { initAdminUI, loadAndRenderAdmin } from './admin/admin-ui.js';
import { startVisitorTracking, stopVisitorTracking } from './tracking/tracker.js';

// DOM Elements
const loadingScreen = document.getElementById('auth-loading-screen');
const authContainer = document.getElementById('auth-container');
const adminContainer = document.getElementById('admin-container');
const portfolioMain = document.getElementById('portfolio-main');
const navbar = document.getElementById('navbar');
const navLinks = document.getElementById('navLinks');

// Application State
let currentUser = null;
let isUserAdmin = false;
let isInitialAuthResolved = false;

/**
 * Client-Side Router
 */
export function navigate(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  handleRoute();
}

/**
 * Handle route changes based on authentication state
 */
async function handleRoute() {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  // If initial auth is still checking, do nothing yet
  if (!isInitialAuthResolved) return;

  // If user is NOT authenticated
  if (!currentUser) {
    stopVisitorTracking();
    hidePortfolio();
    hideAdmin();
    showAuth();

    if (path === '/signup') {
      setAuthMode(authContainer, 'signup');
    } else if (path === '/forgot-password') {
      setAuthMode(authContainer, 'forgot-password');
    } else {
      // Default to /login
      if (path !== '/login') {
        window.history.replaceState({}, '', '/login');
      }
      setAuthMode(authContainer, 'login');
    }
    return;
  }

  // If user IS authenticated
  if (path === '/login' || path === '/signup' || path === '/forgot-password') {
    // Redirect already authenticated users to portfolio
    navigate('/', true);
    return;
  }

  if (path === '/admin') {
    // Admin Route Check
    if (isUserAdmin) {
      hideAuth();
      hidePortfolio();
      showAdmin();
      loadAndRenderAdmin(adminContainer);
    } else {
      console.warn('Unauthorized access to /admin. Redirecting to portfolio.');
      navigate('/', true);
    }
    return;
  }

  // Default: Portfolio Homepage ('/' or any section anchor)
  hideAuth();
  hideAdmin();
  showPortfolio();
  startVisitorTracking(currentUser);

  // If there's an anchor in the hash, scroll to it smoothly
  if (window.location.hash) {
    const targetEl = document.querySelector(window.location.hash);
    if (targetEl) {
      setTimeout(() => {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
}

function showPortfolio() {
  if (portfolioMain) portfolioMain.style.display = 'block';
  if (navbar) navbar.style.display = 'flex';
  updateNavbarProfile();
}

function hidePortfolio() {
  if (portfolioMain) portfolioMain.style.display = 'none';
  if (navbar) navbar.style.display = 'none';
}

function showAuth() {
  if (authContainer) authContainer.classList.remove('hidden');
}

function hideAuth() {
  if (authContainer) authContainer.classList.add('hidden');
}

function showAdmin() {
  if (adminContainer) adminContainer.classList.remove('hidden');
  if (navbar) navbar.style.display = 'flex';
  updateNavbarProfile();
}

function hideAdmin() {
  if (adminContainer) adminContainer.classList.add('hidden');
}

/**
 * Navbar Authenticated User Profile Area
 */
function updateNavbarProfile() {
  const navActions = document.getElementById('navActions');
  if (!navActions) return;

  let profileWrapper = document.getElementById('nav-user-profile');
  if (!currentUser) {
    if (profileWrapper) profileWrapper.remove();
    return;
  }

  if (!profileWrapper) {
    profileWrapper = document.createElement('div');
    profileWrapper.id = 'nav-user-profile';
    profileWrapper.className = 'nav-profile-container';
    navActions.appendChild(profileWrapper);
  }

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];
  const photoURL = currentUser.photoURL;

  const avatarMarkup = photoURL
    ? `<img src="${photoURL}" alt="" class="nav-avatar" />`
    : `<div class="nav-avatar">${getInitials(displayName)}</div>`;

  profileWrapper.innerHTML = `
    <button class="nav-profile-btn" id="nav-profile-btn" aria-haspopup="true" aria-expanded="false" title="Account Menu">
      ${avatarMarkup}
      <span class="nav-profile-name">${escapeHtml(firstName)}</span>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
    <div class="nav-profile-dropdown" id="nav-profile-dropdown">
      <div class="nav-profile-header">
        <div class="nav-profile-header-name">${escapeHtml(displayName)}</div>
        <div class="nav-profile-header-email">${escapeHtml(currentUser.email || '')}</div>
      </div>
      ${isUserAdmin ? `
        <button class="nav-dropdown-item" id="nav-dropdown-admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V10M18 20V4M6 20v-4"/>
          </svg>
          Admin Dashboard
        </button>
      ` : ''}
      <button class="nav-dropdown-item danger" id="nav-dropdown-logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        Sign Out
      </button>
    </div>
  `;

  const btn = profileWrapper.querySelector('#nav-profile-btn');
  const dropdown = profileWrapper.querySelector('#nav-profile-dropdown');
  const adminBtn = profileWrapper.querySelector('#nav-dropdown-admin');
  const logoutBtn = profileWrapper.querySelector('#nav-dropdown-logout');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      dropdown.classList.remove('open');
      navigate('/admin');
    });
  }

  logoutBtn.addEventListener('click', async () => {
    dropdown.classList.remove('open');
    await logoutUser();
    navigate('/login');
  });
}

// Close profile dropdown on outside click
document.addEventListener('click', () => {
  const dropdown = document.getElementById('nav-profile-dropdown');
  if (dropdown && dropdown.classList.contains('open')) {
    dropdown.classList.remove('open');
  }
});

function getInitials(name) {
  if (!name) return 'U';
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

/**
 * Handle browser navigation (back/forward)
 */
window.addEventListener('popstate', () => {
  handleRoute();
});

/**
 * Intercept anchor clicks within portfolio navigation to prevent breaking routing
 */
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  // Allow external links, downloads, mailto, tel
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || anchor.hasAttribute('download')) {
    return;
  }

  // Internal hash links (e.g. #about)
  if (href.startsWith('#')) {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== '/') {
      e.preventDefault();
      navigate('/' + href);
    }
    return;
  }

  // App routing links (e.g. /login, /signup, /admin)
  if (href.startsWith('/')) {
    e.preventDefault();
    navigate(href);
  }
});

/**
 * Application Bootstrap
 */
function initApp() {
  // Initialize Auth UI
  if (authContainer) {
    initAuthUI(authContainer, navigate);
  }

  // Initialize Admin UI container
  if (adminContainer) {
    initAdminUI(adminContainer, navigate);
  }

  // Listen to Firebase Auth state
  subscribeToAuth(async (user) => {
    currentUser = user;
    if (user) {
      isUserAdmin = await checkIsAdmin(user);
    } else {
      isUserAdmin = false;
    }

    if (!isInitialAuthResolved) {
      isInitialAuthResolved = true;
      // Dismiss loading screen with smooth fade
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }
    }

    handleRoute();
  });

  // Check if Firebase is configured
  if (!isFirebaseConfigured()) {
    console.warn('Firebase configuration missing in .env. Showing warning banner.');
    showConfigWarning();
  }
}

function showConfigWarning() {
  const banner = document.createElement('div');
  banner.id = 'firebase-config-warning';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(220, 38, 38, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100000;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  banner.innerHTML = `
    <span>⚠️ <strong>Firebase Not Configured:</strong> Please create <code>.env</code> from <code>.env.example</code> with your Firebase credentials.</span>
    <button style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Dismiss</button>
  `;
  banner.querySelector('button').addEventListener('click', () => banner.remove());
  document.body.appendChild(banner);
}

// Start app once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
