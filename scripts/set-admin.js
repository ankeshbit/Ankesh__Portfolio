/**
 * Production Firebase Admin Claim Management Script
 * 
 * Securely manages Firebase custom auth claims ({ admin: true }) using the Firebase Admin SDK.
 * This runs ONLY on a trusted server, backend, or local administrative environment.
 * Service account private keys are NEVER bundled or exposed to frontend client code.
 * 
 * Usage:
 *   1. Download your Service Account Key from:
 *      Firebase Console -> Project Settings -> Service accounts -> "Generate new private key"
 *   2. Save it as `serviceAccountKey.json` in the project root (ignored by .gitignore).
 *      Alternatively, export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
 *   3. Run:
 *      node scripts/set-admin.js <email-or-uid>
 * 
 * Options:
 *      node scripts/set-admin.js <email-or-uid>              # Grant admin: true
 *      node scripts/set-admin.js --check <email-or-uid>       # Inspect current claims
 *      node scripts/set-admin.js --revoke <email-or-uid>      # Remove admin claim
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Parse CLI Arguments
const args = process.argv.slice(2);
let mode = 'grant'; // 'grant' | 'check' | 'revoke'
let identifier = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--check') {
    mode = 'check';
  } else if (arg === '--revoke') {
    mode = 'revoke';
  } else if (arg === '--grant') {
    mode = 'grant';
  } else if (!identifier && !arg.startsWith('--')) {
    identifier = arg;
  }
}

if (!identifier) {
  console.error('\n❌ Missing user identifier (Email or Firebase UID).');
  console.log('\nUsage Examples:');
  console.log('  node scripts/set-admin.js your-email@gmail.com');
  console.log('  node scripts/set-admin.js 4Yp9aK01xYzAbCdEfGhIjKlMnOp1');
  console.log('  node scripts/set-admin.js --check your-email@gmail.com');
  console.log('  node scripts/set-admin.js --revoke your-email@gmail.com\n');
  process.exit(1);
}

// Locate Service Account Key
const localKeyPath = resolve(process.cwd(), 'serviceAccountKey.json');
let credential = null;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  credential = applicationDefault();
} else if (existsSync(localKeyPath)) {
  try {
    const serviceAccount = JSON.parse(readFileSync(localKeyPath, 'utf8'));
    credential = cert(serviceAccount);
  } catch (err) {
    console.error('\n❌ Failed to parse serviceAccountKey.json:', err.message);
    process.exit(1);
  }
} else {
  console.error('\n❌ Firebase Admin credentials not found.');
  console.error('To run this administrative script safely:');
  console.error('1. Go to Firebase Console -> Project Settings -> Service accounts');
  console.error('2. Click "Generate new private key"');
  console.error('3. Save the downloaded JSON file as `serviceAccountKey.json` in this project root');
  console.error('   (Note: serviceAccountKey.json is strictly ignored by .gitignore to prevent Git commits)\n');
  process.exit(1);
}

try {
  initializeApp({ credential });
  const auth = getAuth();

  // Find user by UID or Email
  let user;
  if (identifier.includes('@')) {
    user = await auth.getUserByEmail(identifier);
  } else {
    try {
      user = await auth.getUser(identifier);
    } catch {
      user = await auth.getUserByEmail(identifier);
    }
  }

  const existingClaims = user.customClaims || {};

  if (mode === 'check') {
    console.log(`\n🔍 User Details:`);
    console.log(`   UID:          ${user.uid}`);
    console.log(`   Email:        ${user.email || 'No email'}`);
    console.log(`   DisplayName:  ${user.displayName || 'None'}`);
    console.log(`   CustomClaims: ${JSON.stringify(existingClaims, null, 2)}`);
    console.log(`   Admin Status: ${existingClaims.admin === true ? '✅ YES (admin: true)' : '❌ NO'}\n`);
    process.exit(0);
  }

  if (mode === 'revoke') {
    const updatedClaims = { ...existingClaims };
    delete updatedClaims.admin;

    await auth.setCustomUserClaims(user.uid, updatedClaims);
    console.log(`\n🛡️ Admin claim revoked for user:`);
    console.log(`   UID:   ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Claims: ${JSON.stringify(updatedClaims)}\n`);
    process.exit(0);
  }

  // Default: Grant { admin: true }
  const updatedClaims = {
    ...existingClaims,
    admin: true
  };

  await auth.setCustomUserClaims(user.uid, updatedClaims);

  // Re-verify from Firebase
  const verifiedUser = await auth.getUser(user.uid);

  console.log(`\n======================================================`);
  console.log(`✅ SUCCESS: Admin Custom Claim Assigned!`);
  console.log(`======================================================`);
  console.log(`  User UID:       ${verifiedUser.uid}`);
  console.log(`  User Email:     ${verifiedUser.email}`);
  console.log(`  Display Name:   ${verifiedUser.displayName || 'Visitor'}`);
  console.log(`  Custom Claims:  ${JSON.stringify(verifiedUser.customClaims)}`);
  console.log(`  Admin Status:   admin === true`);
  console.log(`======================================================`);
  console.log(`\nNext Steps:`);
  console.log(`1. In your browser, if you are currently logged in with this account:`);
  console.log(`   Sign out and sign back in (or refresh the page).`);
  console.log(`   Your Firebase ID token will now carry the 'admin: true' claim.`);
  console.log(`2. The portfolio will automatically show "Admin Dashboard" in your profile menu.`);
  console.log(`3. Firestore security rules will authorize your read access to /admin analytics.\n`);

} catch (err) {
  console.error('\n❌ Admin operation failed:', err.message);
  process.exit(1);
}
