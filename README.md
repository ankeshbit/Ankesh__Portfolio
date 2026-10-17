# Ankesh Srivastava — Developer Portfolio & Analytics

Modern interactive developer portfolio built with Vanilla JS (ES Modules), Vite 8, and Firebase (Authentication + Firestore).

## 🚀 Quick Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Firebase project configuration:
   ```bash
   cp .env.example .env
   ```

3. **Deploy Firestore Security Rules**:
   Deploy the tightened security rules to your Firebase project:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Grant Admin Privileges**:
   To access `/admin` (Visitor Analytics Dashboard), grant admin claims to your account email using Firebase Admin SDK:
   ```bash
   npm run admin:grant <your-email@example.com>
   ```

5. **Run Locally**:
   ```bash
   npm run dev
   ```

6. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Firebase App Check Recommendation

> [!IMPORTANT]
> **Firebase App Check Recommendation:**
> Since account signup is open to the public for portfolio visitors, it is strongly recommended to enable **Firebase App Check** (using reCAPTCHA Enterprise or reCAPTCHA v3) in the Firebase Console. App Check protects your backend Firestore and Auth services from abuse, automated scrapers, and unauthorized API traffic.

---

## 🌐 SPA Routing & Hosting Deployment

The project includes Single-Page Application (SPA) routing fallbacks for production hosting:

- **GitHub Pages**:
  - `public/404.html` captures requests to deep links (such as `/login`, `/admin`, `/signup`) and redirects to `index.html` while preserving query parameters and subpaths.
  - Set `VITE_BASE=/your-repo-name/` in `.env` if deploying to a GitHub Pages repository subpath.
  - In `public/404.html`, `pathSegmentsToKeep` must be set to `1` for GitHub Pages project sites (`https://<user>.github.io/<repo>/`) so the repository subpath is preserved during redirect (leave as `0` for user/custom root domains).
- **Netlify**:
  - `public/_redirects` contains `/*  /index.html  200` to direct all routes to the single-page application router.
- **Vercel / Other Static Hosts**:
  - Rewrites all non-file requests to `/index.html`.

---

## 🧪 Verification & Session Sync Testing

### Manual Note: Signup & Reload `loginCount` Invariant
To manually verify that profile synchronization runs once per browser session and does not duplicate or increment `loginCount` upon page reloads:
1. Open the application and navigate to `/signup`.
2. Register a new email account (e.g. `visitor@example.com`).
3. After registration and redirection to `/`, open Firestore Database (in Firebase Console or local emulator UI).
4. Verify document `users/{uid}` exists with `loginCount == 1`.
5. Reload the page once (`F5` or `Ctrl+R`).
6. Confirm `users/{uid}.loginCount` is still `1`:
   - `syncUserProfileOncePerSession` reads `sessionStorage.getItem('synced_profile_<uid>')`, sees the session key, and exits early without sending a returning-login update.

