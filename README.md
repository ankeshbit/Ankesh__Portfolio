# Ankesh Srivastava — Portfolio with Firebase Authentication & Visitor Tracking

A production-grade, dark-themed personal developer portfolio integrating **Firebase Authentication**, **Firestore Visitor Tracking**, and a secure **Admin Analytics Dashboard**, styled to match the signature Navy & Gold design system.

---

## 🚀 Features

- **Authentication Gatekeeper**: Unauthenticated visitors are routed to the branded `/login` page before accessing the portfolio.
- **Multi-Provider Auth**:
  - Email & Password (with validation, show/hide password toggle, and password reset)
  - Google Sign-In (OAuth popup)
  - GitHub Sign-In (OAuth popup)
- **Visitor Tracking (`users` collection)**:
  - Tracks visitor profile: `uid`, `displayName`, `email`, `photoURL`, `provider`
  - Records `createdAt`, `lastLoginAt`, `loginCount`, and `lastSeenAt`
- **Session & Section Analytics (`visits` collection)**:
  - Records visit sessions (`startedAt`, `page`, `userAgent`, `referrer`)
  - Tracks sections viewed (`landing`, `about`, `projects`, etc.) with debounced/throttled writes
- **Admin Dashboard (`/admin`)**:
  - Real-time visitor metrics: Total Visitors, New Visitors (7d), Visits Today, Returning Visitors
  - Search by visitor name or email
  - Filter by auth provider (Google, GitHub, Email)
  - Sort by Last Visit (newest/oldest), Login Count, or Name
  - Back to portfolio & quick logout
- **Navbar Profile**:
  - Displays visitor avatar (Google/GitHub photo or initials) and first name
  - Dropdown menu with account details, Admin Dashboard link (for authorized admins), and Sign Out
- **Zero Disruption to Existing Portfolio**:
  - All original sections, animations (typing effect, particle canvas, scroll reveals), certificates modal, and styles remain 100% intact.

---

## 🛠️ Tech Stack & Architecture

- **Core**: Vanilla HTML5, Vanilla CSS3, Vanilla ES Modules
- **Dev Server / Bundler**: [Vite](https://vite.dev/)
- **Backend & Database**: Firebase Authentication (v12 modular SDK), Cloud Firestore
- **Security**: Firestore Security Rules (`firestore.rules`) + Firebase Custom Claims (`token.admin == true`)

---

## 📋 Complete Setup Guide

Follow these steps to configure Firebase and launch the project:

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter your project name (e.g., `ankesh-portfolio`) and click **Continue**.
4. Choose whether to enable Google Analytics, then click **Create project**.

### 2. Register a Web App
1. In your Firebase project overview, click the **Web icon** (`</>`) to add an app.
2. Enter an App nickname (e.g., `Portfolio Web App`).
3. Click **Register app**.
4. Firebase will display your `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 3. Configure Environment Variables
1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:...

   # Optional admin fallback email:
   VITE_ADMIN_EMAIL=ankeshsrivastava61289@gmail.com
   ```

### 4. Enable Authentication Providers in Firebase Console
In the Firebase Console sidebar, navigate to **Build** -> **Authentication**, click **Get started**, and configure the providers in the **Sign-in method** tab:

#### A. Email / Password
1. Click **Email/Password**.
2. Toggle **Enable** to ON.
3. Leave "Email link (passwordless sign-in)" OFF.
4. Click **Save**.

#### B. Google Sign-In
1. Click **Add new provider** -> **Google**.
2. Toggle **Enable** to ON.
3. Select your **Project support email** from the dropdown.
4. Click **Save**.

#### C. GitHub Sign-In
1. In GitHub, go to **Settings** -> **Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
   - **Application name**: `Ankesh Portfolio`
   - **Homepage URL**: `http://localhost:5173` (or your production domain)
   - **Authorization callback URL**: Copy the callback URL provided in the Firebase GitHub configuration dialog (format: `https://<project-id>.firebaseapp.com/__/auth/handler`).
2. Register the application on GitHub and generate a **Client Secret**.
3. In the Firebase Console, select **GitHub** under Sign-in providers:
   - Toggle **Enable** to ON.
   - Enter your GitHub **Client ID**.
   - Enter your GitHub **Client Secret**.
   - Click **Save**.

> **Note**: In Firebase Console -> Authentication -> **Settings** -> **Authorized domains**, ensure `localhost` is listed.

---

### 5. Enable Cloud Firestore
1. In the Firebase Console sidebar, navigate to **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your users (e.g., `asia-south1` or `us-central1`).
4. Select **Start in production mode** (we will deploy strict rules next).
5. Click **Create**.

---

### 6. Deploy Firestore Security Rules
In Firebase Console -> **Firestore Database** -> **Rules** tab, paste the contents of [`firestore.rules`](file:///c:/Users/ankes/OneDrive/Desktop/Ankesh-Portfolio/firestore.rules):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }

    match /users/{userId} {
      allow get: if isOwner(userId) || isAdmin();
      allow list: if isAdmin();

      allow create: if isOwner(userId)
        && request.resource.data.uid == request.auth.uid
        && !('admin' in request.resource.data)
        && (!('role' in request.resource.data) || request.resource.data.role == 'visitor');

      allow update: if (
        isOwner(userId)
        && request.resource.data.uid == resource.data.uid
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['admin', 'role', 'createdAt', 'uid'])
      ) || isAdmin();

      allow delete: if isAdmin();
    }

    match /visits/{visitId} {
      allow get: if (isAuthenticated() && resource.data.uid == request.auth.uid) || isAdmin();
      allow list: if isAdmin();

      allow create: if isAuthenticated()
        && request.resource.data.uid == request.auth.uid;

      allow update: if (
        isAuthenticated()
        && resource.data.uid == request.auth.uid
        && request.resource.data.uid == resource.data.uid
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['uid', 'startedAt'])
      ) || isAdmin();

      allow delete: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Click **Publish**.

---

### 7. Configure Admin Authorization (Custom Claims)
To grant an account access to the `/admin` dashboard:

1. In the Firebase Console -> **Project Settings** (gear icon) -> **Service accounts** tab.
2. Click **Generate new private key** and download the JSON file.
3. Save the JSON file as `serviceAccountKey.json` in the root directory (this file is strictly ignored by `.gitignore`).
4. Install `firebase-admin` and run the script:
   ```bash
   npm install firebase-admin
   node scripts/set-admin.js your-email@gmail.com
   ```
5. When that user signs in, their token will have `{ admin: true }` and they will be granted access to `/admin` and authorized in Firestore rules.

---

### 8. Run the Application

```bash
# Start the local Vite development server
npm run dev

# Or build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser:
- Unauthenticated visitors will see `/login`.
- After signing in (Email, Google, or GitHub), you enter the full portfolio.
- Access the Admin Dashboard at `/admin` (available from the navbar profile menu for admins).

---

## 🔒 Security Best Practices Implemented

- **No Stored Passwords**: Passwords are handled exclusively by Firebase Authentication.
- **Server Timestamps**: Firestore `serverTimestamp()` is used for all timestamps (`createdAt`, `lastLoginAt`, `lastSeenAt`, `startedAt`, `lastActivityAt`).
- **Owner-Only Firestore Access**: Regular users can only access their own profile document and active visit record.
- **Protected Analytics**: Only accounts with `token.admin === true` or designated admin identity can read the `visits` collection and query all users.
- **No Secrets in Frontend Code**: All sensitive client keys are abstracted to environment variables; admin private keys are never included in frontend bundles or committed to git.
