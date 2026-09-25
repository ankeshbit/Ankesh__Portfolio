import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginWithGithub,
  resetPassword,
  mapAuthError
} from '../firebase/auth.js';
import { syncUserProfile } from '../firebase/firestore.js';

// SVG Icons
const GOOGLE_ICON = `
<svg viewBox="0 0 24 24" width="20" height="20">
  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
</svg>`;

const GITHUB_ICON = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
</svg>`;

const EYE_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
  <circle cx="12" cy="12" r="3"></circle>
</svg>`;

const EYE_OFF_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
  <line x1="1" y1="1" x2="23" y2="23"></line>
</svg>`;

const ALERT_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="8" x2="12" y2="12"></line>
  <line x1="12" y1="16" x2="12.01" y2="16"></line>
</svg>`;

const SUCCESS_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
  <polyline points="22 4 12 14.01 9 11.01"></polyline>
</svg>`;

let navigateFn = null;
let currentMode = 'login'; // 'login' | 'signup' | 'forgot-password'
let isSubmitting = false;

export function initAuthUI(containerEl, onNavigate) {
  navigateFn = onNavigate;
  renderAuthView(containerEl, currentMode);
}

export function setAuthMode(containerEl, mode) {
  currentMode = mode;
  if (containerEl) {
    renderAuthView(containerEl, mode);
  }
}

function renderAuthView(container, mode) {
  if (!container) return;

  let contentHtml = '';

  if (mode === 'signup') {
    contentHtml = `
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-monogram">AS</div>
          <h2 class="auth-title">Create Your Account</h2>
          <p class="auth-subtitle">Join Ankesh's portfolio community</p>
        </div>

        <div id="auth-alert-box" style="display: none;"></div>

        <form id="signup-form" class="auth-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="signup-name">Full Name</label>
            <input 
              type="text" 
              id="signup-name" 
              class="auth-input" 
              placeholder="e.g. Rahul Sharma" 
              required 
              autocomplete="name"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="signup-email">Email Address</label>
            <input 
              type="email" 
              id="signup-email" 
              class="auth-input" 
              placeholder="Enter your email" 
              required 
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="signup-password">Password</label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="signup-password" 
                class="auth-input has-toggle" 
                placeholder="At least 6 characters" 
                required 
                autocomplete="new-password"
              />
              <button type="button" class="password-toggle-btn" aria-label="Toggle password visibility" data-target="signup-password">
                ${EYE_ICON}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="signup-confirm-password">Confirm Password</label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="signup-confirm-password" 
                class="auth-input has-toggle" 
                placeholder="Re-enter your password" 
                required 
                autocomplete="new-password"
              />
              <button type="button" class="password-toggle-btn" aria-label="Toggle confirm password visibility" data-target="signup-confirm-password">
                ${EYE_ICON}
              </button>
            </div>
          </div>

          <button type="submit" id="signup-submit-btn" class="auth-submit-btn">
            Create Account
          </button>
        </form>

        <div class="auth-divider">OR</div>

        <div class="social-buttons">
          <button type="button" id="google-login-btn" class="btn-social">
            ${GOOGLE_ICON}
            <span>Continue with Google</span>
          </button>
          <button type="button" id="github-login-btn" class="btn-social">
            ${GITHUB_ICON}
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div class="auth-footer">
          Already have an account?
          <a href="/login" id="link-to-login">Sign In</a>
        </div>
      </div>
    `;
  } else if (mode === 'forgot-password') {
    contentHtml = `
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-monogram">AS</div>
          <h2 class="auth-title">Reset Your Password</h2>
          <p class="auth-subtitle">Enter your email and we'll send you a password reset link.</p>
        </div>

        <div id="auth-alert-box" style="display: none;"></div>

        <form id="forgot-form" class="auth-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="forgot-email">Email Address</label>
            <input 
              type="email" 
              id="forgot-email" 
              class="auth-input" 
              placeholder="Enter your email" 
              required 
              autocomplete="email"
            />
          </div>

          <button type="submit" id="forgot-submit-btn" class="auth-submit-btn">
            Send Reset Link
          </button>
        </form>

        <div class="auth-footer">
          <a href="/login" id="link-to-login">Back to Sign In</a>
        </div>
      </div>
    `;
  } else {
    // Default: Login
    contentHtml = `
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-monogram">AS</div>
          <h2 class="auth-title">Welcome Back</h2>
          <p class="auth-subtitle">Sign in to continue to Ankesh's portfolio</p>
        </div>

        <div id="auth-alert-box" style="display: none;"></div>

        <form id="login-form" class="auth-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Email</label>
            <input 
              type="email" 
              id="login-email" 
              class="auth-input" 
              placeholder="Enter your email" 
              required 
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <div class="form-label">
              <label for="login-password">Password</label>
              <a href="/forgot-password" class="form-label-link" id="link-forgot-pw">Forgot password?</a>
            </div>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="login-password" 
                class="auth-input has-toggle" 
                placeholder="Enter your password" 
                required 
                autocomplete="current-password"
              />
              <button type="button" class="password-toggle-btn" aria-label="Toggle password visibility" data-target="login-password">
                ${EYE_ICON}
              </button>
            </div>
          </div>

          <button type="submit" id="login-submit-btn" class="auth-submit-btn">
            Sign In
          </button>
        </form>

        <div class="auth-divider">OR</div>

        <div class="social-buttons">
          <button type="button" id="google-login-btn" class="btn-social">
            ${GOOGLE_ICON}
            <span>Continue with Google</span>
          </button>
          <button type="button" id="github-login-btn" class="btn-social">
            ${GITHUB_ICON}
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div class="auth-footer">
          Don't have an account?
          <a href="/signup" id="link-to-signup">Create an account</a>
        </div>
      </div>
    `;
  }

  container.innerHTML = contentHtml;
  bindEvents(container, mode);
}

function bindEvents(container, mode) {
  // Navigation Links
  const linkToLogin = container.querySelector('#link-to-login');
  if (linkToLogin) {
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (navigateFn) navigateFn('/login');
    });
  }

  const linkToSignup = container.querySelector('#link-to-signup');
  if (linkToSignup) {
    linkToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      if (navigateFn) navigateFn('/signup');
    });
  }

  const linkForgot = container.querySelector('#link-forgot-pw');
  if (linkForgot) {
    linkForgot.addEventListener('click', (e) => {
      e.preventDefault();
      if (navigateFn) navigateFn('/forgot-password');
    });
  }

  // Password Visibility Toggles
  const toggleBtns = container.querySelectorAll('.password-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = container.querySelector(`#${targetId}`);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = EYE_OFF_ICON;
      } else {
        input.type = 'password';
        btn.innerHTML = EYE_ICON;
      }
    });
  });

  // Social Login: Google
  const googleBtn = container.querySelector('#google-login-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      if (isSubmitting) return;
      setLoading(googleBtn, true, 'Connecting to Google...');
      clearAlert(container);

      try {
        const user = await loginWithGoogle();
        await syncUserProfile(user);
        if (navigateFn) navigateFn('/');
      } catch (err) {
        showAlert(container, 'error', mapAuthError(err));
      } finally {
        setLoading(googleBtn, false, `${GOOGLE_ICON}<span>Continue with Google</span>`, true);
      }
    });
  }

  // Social Login: GitHub
  const githubBtn = container.querySelector('#github-login-btn');
  if (githubBtn) {
    githubBtn.addEventListener('click', async () => {
      if (isSubmitting) return;
      setLoading(githubBtn, true, 'Connecting to GitHub...');
      clearAlert(container);

      try {
        const user = await loginWithGithub();
        await syncUserProfile(user);
        if (navigateFn) navigateFn('/');
      } catch (err) {
        showAlert(container, 'error', mapAuthError(err));
      } finally {
        setLoading(githubBtn, false, `${GITHUB_ICON}<span>Continue with GitHub</span>`, true);
      }
    });
  }

  // Mode-Specific Form Submissions
  if (mode === 'login') {
    const form = container.querySelector('#login-form');
    const submitBtn = container.querySelector('#login-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const email = container.querySelector('#login-email').value.trim();
      const password = container.querySelector('#login-password').value;

      if (!email || !password) {
        showAlert(container, 'error', 'Please fill in all fields.');
        return;
      }

      setLoading(submitBtn, true, 'Signing in...');
      clearAlert(container);

      try {
        const user = await loginWithEmail(email, password);
        await syncUserProfile(user);
        if (navigateFn) navigateFn('/');
      } catch (err) {
        showAlert(container, 'error', mapAuthError(err));
      } finally {
        setLoading(submitBtn, false, 'Sign In');
      }
    });
  } else if (mode === 'signup') {
    const form = container.querySelector('#signup-form');
    const submitBtn = container.querySelector('#signup-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const name = container.querySelector('#signup-name').value.trim();
      const email = container.querySelector('#signup-email').value.trim();
      const password = container.querySelector('#signup-password').value;
      const confirmPassword = container.querySelector('#signup-confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        showAlert(container, 'error', 'Please fill in all fields.');
        return;
      }

      if (password.length < 6) {
        showAlert(container, 'error', 'Password should be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert(container, 'error', 'Passwords do not match.');
        return;
      }

      setLoading(submitBtn, true, 'Creating account...');
      clearAlert(container);

      try {
        const user = await registerWithEmail(name, email, password);
        await syncUserProfile(user);
        if (navigateFn) navigateFn('/');
      } catch (err) {
        showAlert(container, 'error', mapAuthError(err));
      } finally {
        setLoading(submitBtn, false, 'Create Account');
      }
    });
  } else if (mode === 'forgot-password') {
    const form = container.querySelector('#forgot-form');
    const submitBtn = container.querySelector('#forgot-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const email = container.querySelector('#forgot-email').value.trim();

      if (!email) {
        showAlert(container, 'error', 'Please enter your email address.');
        return;
      }

      setLoading(submitBtn, true, 'Sending reset link...');
      clearAlert(container);

      try {
        await resetPassword(email);
        showAlert(container, 'success', 'Password reset instructions have been sent to your email.');
        submitBtn.disabled = true;
      } catch (err) {
        showAlert(container, 'error', mapAuthError(err));
      } finally {
        if (!submitBtn.disabled) {
          setLoading(submitBtn, false, 'Send Reset Link');
        } else {
          submitBtn.innerHTML = 'Link Sent';
          isSubmitting = false;
        }
      }
    });
  }
}

function setLoading(btn, loading, text, isHtml = false) {
  if (!btn) return;
  isSubmitting = loading;
  btn.disabled = loading;

  if (loading) {
    btn.innerHTML = `<div class="spinner ${btn.classList.contains('btn-social') ? 'spinner-light' : ''}"></div> <span>${text}</span>`;
  } else {
    if (isHtml) {
      btn.innerHTML = text;
    } else {
      btn.textContent = text;
    }
  }
}

function showAlert(container, type, message) {
  const alertBox = container.querySelector('#auth-alert-box');
  if (!alertBox) return;

  const icon = type === 'error' ? ALERT_ICON : SUCCESS_ICON;
  const alertClass = type === 'error' ? 'auth-alert auth-alert-error' : 'auth-alert auth-alert-success';

  alertBox.className = alertClass;
  alertBox.innerHTML = `${icon}<div>${message}</div>`;
  alertBox.style.display = 'flex';
}

function clearAlert(container) {
  const alertBox = container.querySelector('#auth-alert-box');
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }
}
