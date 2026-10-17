import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
  getCountFromServer,
  Timestamp
} from 'firebase/firestore';
import fs from 'fs';

const PROJECT_ID = 'ankesh-portfolio-rules-test';
const RULES = fs.readFileSync('firestore.rules', 'utf8');

async function runTests() {
  console.log('--- Initializing Rules Test Environment ---');
  let host = '127.0.0.1';
  let port = 8080;
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const parts = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    host = parts[0];
    port = parseInt(parts[1], 10);
  }

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: RULES,
      host,
      port
    }
  });

  let totalTests = 0;
  let passedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  }

  try {
    await testEnv.clearFirestore();

    const aliceContext = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
    const aliceDb = aliceContext.firestore();

    const bobContext = testEnv.authenticatedContext('bob', { email: 'bob@example.com' });
    const bobDb = bobContext.firestore();

    const charlieContext = testEnv.authenticatedContext('charlie', { email: 'charlie@example.com' });
    const charlieDb = charlieContext.firestore();

    const adminContext = testEnv.authenticatedContext('admin-user', {
      email: 'admin@example.com',
      admin: true
    });
    const adminDb = adminContext.firestore();

    const unauthContext = testEnv.unauthenticatedContext();
    const unauthDb = unauthContext.firestore();

    console.log('\n[1. User Profile Creation (First Login & Exact Client Payloads)]');
    await test('Alice can create her user profile with role "visitor", loginCount 1, and serverTimestamp()', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        setDoc(aliceRef, {
          uid: 'alice',
          displayName: 'Alice Visitor',
          email: 'alice@example.com',
          photoURL: 'https://example.com/avatar.jpg',
          provider: 'google',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          lastSeenAt: serverTimestamp(),
          role: 'visitor'
        })
      );
    });

    await test('NEGATIVE: Forged createdAt (past or arbitrary timestamp) on first login is REJECTED', async () => {
      const forgedUserRef = doc(bobDb, 'users', 'bob');
      await assertFails(
        setDoc(forgedUserRef, {
          uid: 'bob',
          displayName: 'Bob Forged',
          email: 'bob@example.com',
          provider: 'email',
          createdAt: Timestamp.fromDate(new Date('2020-01-01T00:00:00Z')),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          lastSeenAt: serverTimestamp(),
          role: 'visitor'
        })
      );
    });

    await test('POSITIVE CONTROL: Normal first login for email user with createdAt == serverTimestamp() and NO photoURL is ALLOWED', async () => {
      const charlieRef = doc(charlieDb, 'users', 'charlie');
      await assertSucceeds(
        setDoc(charlieRef, {
          uid: 'charlie',
          displayName: 'Charlie Email User',
          email: 'charlie@example.com',
          provider: 'email',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          lastSeenAt: serverTimestamp(),
          role: 'visitor'
        })
      );
    });

    console.log('\n[2. User Profile Update (Returning Login & Heartbeat Payloads)]');
    await test('Alice can update profile on returning login with increment(1) and serverTimestamp()', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: increment(1)
        })
      );
    });

    await test('Positive client payload: Returning login with NO displayName/photoURL using increment(1) is ALLOWED', async () => {
      const charlieRef = doc(charlieDb, 'users', 'charlie');
      await assertSucceeds(
        updateDoc(charlieRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: increment(1)
        })
      );
    });

    await test('Positive client payload: Heartbeat-only update {lastSeenAt: serverTimestamp()} is ALLOWED', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          lastSeenAt: serverTimestamp()
        })
      );
    });

    console.log('\n[3. Negative Tests Paired with Positive Controls]');

    // 3a. photoURL tests
    await test('NEGATIVE: Rejected if photoURL is not https (e.g. http://insecure.com)', async () => {
      const bobRef = doc(bobDb, 'users', 'bob');
      await assertFails(
        setDoc(bobRef, {
          uid: 'bob',
          displayName: 'Bob',
          email: 'bob@example.com',
          photoURL: 'http://insecure.com/avatar.jpg',
          provider: 'email',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          lastSeenAt: serverTimestamp(),
          role: 'visitor'
        })
      );
    });

    await test('POSITIVE CONTROL: Identical write with https photoURL succeeds', async () => {
      const bobRef = doc(bobDb, 'users', 'bob');
      await assertSucceeds(
        setDoc(bobRef, {
          uid: 'bob',
          displayName: 'Bob',
          email: 'bob@example.com',
          photoURL: 'https://secure.com/avatar.jpg',
          provider: 'email',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          lastSeenAt: serverTimestamp(),
          role: 'visitor'
        })
      );
    });

    // 3b. arbitrary loginCount
    await test('NEGATIVE: Rejected if loginCount is arbitrary jump (2 -> 99)', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertFails(
        updateDoc(aliceRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: 99
        })
      );
    });

    await test('POSITIVE CONTROL: Identical update with valid sequential increment(1) succeeds', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: increment(1)
        })
      );
    });

    // 3c. non-integer loginCount
    await test('NEGATIVE: Rejected if loginCount is non-integer string ("four")', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertFails(
        updateDoc(aliceRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: 'four'
        })
      );
    });

    await test('POSITIVE CONTROL: Identical update with valid integer loginCount succeeds', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: increment(1)
        })
      );
    });

    // 3d. non-timestamp updates
    await test('NEGATIVE: Non-timestamp lastLoginAt or lastSeenAt on update is REJECTED', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertFails(
        updateDoc(aliceRef, {
          lastLoginAt: 'not-a-timestamp'
        })
      );
      await assertFails(
        updateDoc(aliceRef, {
          lastSeenAt: 123456789
        })
      );
    });

    // 3e. extra unwhitelisted fields
    await test('NEGATIVE: Rejected if unwhitelisted fields are included on update', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertFails(
        updateDoc(aliceRef, {
          customHackerField: 'injected_data'
        })
      );
    });

    await test('POSITIVE CONTROL: Identical update without extra field succeeds', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          displayName: 'Alice Legitimate Update'
        })
      );
    });

    // 3f. role change
    await test('NEGATIVE: Rejected if non-admin tries to change role to "admin"', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertFails(
        updateDoc(aliceRef, {
          role: 'admin'
        })
      );
    });

    await test('POSITIVE CONTROL: Updating allowed fields without changing role succeeds', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          displayName: 'Alice Still Visitor'
        })
      );
    });

    // 3g. email change
    await test('NEGATIVE: Rejected if non-admin tries to change email', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertFails(
        updateDoc(aliceRef, {
          email: 'hacker@takeover.com'
        })
      );
    });

    await test('POSITIVE CONTROL: Update keeping existing email identical succeeds', async () => {
      const aliceRef = doc(aliceDb, 'users', 'alice');
      await assertSucceeds(
        updateDoc(aliceRef, {
          email: 'alice@example.com'
        })
      );
    });

    // 3h. cross-user write
    await test('NEGATIVE: Alice cannot modify Bob\'s document', async () => {
      const bobRefFromAlice = doc(aliceDb, 'users', 'bob');
      await assertFails(
        updateDoc(bobRefFromAlice, {
          displayName: 'Alice Hacked Bob'
        })
      );
    });

    await test('POSITIVE CONTROL: Bob can modify his own document', async () => {
      const bobRef = doc(bobDb, 'users', 'bob');
      await assertSucceeds(
        updateDoc(bobRef, {
          displayName: 'Bob Legitimate Update'
        })
      );
    });

    console.log('\n[4. Visits Collection (Create, Referrer Capping & Truncation)]');
    let visitDocRef = null;
    await test('Positive client payload: Visit create with referrer "direct" is ALLOWED', async () => {
      const visitsCol = collection(aliceDb, 'visits');
      visitDocRef = doc(visitsCol, 'visit-alice-1');
      await assertSucceeds(
        setDoc(visitDocRef, {
          uid: 'alice',
          visitorName: 'Alice Visitor',
          visitorEmail: 'alice@example.com',
          startedAt: serverTimestamp(),
          lastActivityAt: serverTimestamp(),
          page: '/',
          sectionsViewed: ['landing'],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          referrer: 'direct'
        })
      );
    });

    const rawLongReferrer = 'https://example.com/search?q=' + 'a'.repeat(1500);

    await test('NEGATIVE: Over-long raw referrer (>256 chars, 1530 chars) is REJECTED', async () => {
      const overlongVisitRef = doc(aliceDb, 'visits', 'visit-alice-long');
      await assertFails(
        setDoc(overlongVisitRef, {
          uid: 'alice',
          visitorName: 'Alice Visitor',
          visitorEmail: 'alice@example.com',
          startedAt: serverTimestamp(),
          lastActivityAt: serverTimestamp(),
          page: '/',
          sectionsViewed: ['landing'],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          referrer: rawLongReferrer
        })
      );
    });

    await test('POSITIVE CONTROL: Truncated referrer (substring(0, 256)) is ACCEPTED', async () => {
      const truncatedVisitRef = doc(aliceDb, 'visits', 'visit-alice-truncated');
      await assertSucceeds(
        setDoc(truncatedVisitRef, {
          uid: 'alice',
          visitorName: 'Alice Visitor',
          visitorEmail: 'alice@example.com',
          startedAt: serverTimestamp(),
          lastActivityAt: serverTimestamp(),
          page: '/',
          sectionsViewed: ['landing'],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          referrer: rawLongReferrer.substring(0, 256)
        })
      );
    });

    console.log('\n[5. Visits Collection (Update Sections & ArrayUnion)]');
    await test('Positive client payload: Visit update adding 3 sections in one arrayUnion is ALLOWED', async () => {
      await assertSucceeds(
        updateDoc(visitDocRef, {
          sectionsViewed: arrayUnion('about', 'projects', 'contact'),
          lastActivityAt: serverTimestamp()
        })
      );
    });

    await test('NEGATIVE: Alice cannot tamper with visit uid or startedAt', async () => {
      await assertFails(
        updateDoc(visitDocRef, {
          startedAt: serverTimestamp()
        })
      );
      await assertFails(
        updateDoc(visitDocRef, {
          uid: 'bob'
        })
      );
    });

    await test('POSITIVE CONTROL: Alice updating only sectionsViewed & lastActivityAt succeeds', async () => {
      await assertSucceeds(
        updateDoc(visitDocRef, {
          sectionsViewed: arrayUnion('certifications'),
          lastActivityAt: serverTimestamp()
        })
      );
    });

    await test('NEGATIVE: Bob cannot update Alice\'s visit', async () => {
      const alicesVisitFromBob = doc(bobDb, 'visits', 'visit-alice-1');
      await assertFails(
        updateDoc(alicesVisitFromBob, {
          sectionsViewed: ['hacked']
        })
      );
    });

    await test('POSITIVE CONTROL: Alice can update her own visit', async () => {
      await assertSucceeds(
        updateDoc(visitDocRef, {
          sectionsViewed: arrayUnion('skills'),
          lastActivityAt: serverTimestamp()
        })
      );
    });

    console.log('\n[6. Admin List & Aggregations (users and visits)]');
    await test('POSITIVE: Admin with request.auth.token.admin == true can list all users', async () => {
      const usersCol = collection(adminDb, 'users');
      await assertSucceeds(getDocs(usersCol));
    });

    await test('POSITIVE: Admin can run count aggregation queries on users', async () => {
      const usersCol = collection(adminDb, 'users');
      await assertSucceeds(getCountFromServer(usersCol));
    });

    await test('POSITIVE: Admin can list all visits in /visits', async () => {
      const visitsCol = collection(adminDb, 'visits');
      await assertSucceeds(getDocs(visitsCol));
    });

    await test('POSITIVE: Admin can run count aggregation queries on visits', async () => {
      const visitsCol = collection(adminDb, 'visits');
      await assertSucceeds(getCountFromServer(visitsCol));
    });

    console.log('\n[7. Non-Admin List Denied (users and visits)]');
    await test('NEGATIVE: Non-admin Alice cannot list /users', async () => {
      const usersCol = collection(aliceDb, 'users');
      await assertFails(getDocs(usersCol));
    });

    await test('NEGATIVE: Non-admin Alice cannot run count aggregations on /users', async () => {
      const usersCol = collection(aliceDb, 'users');
      await assertFails(getCountFromServer(usersCol));
    });

    await test('NEGATIVE: Non-admin Alice cannot list /visits', async () => {
      const visitsCol = collection(aliceDb, 'visits');
      await assertFails(getDocs(visitsCol));
    });

    await test('NEGATIVE: Non-admin Alice cannot run count aggregations on /visits', async () => {
      const visitsCol = collection(aliceDb, 'visits');
      await assertFails(getCountFromServer(visitsCol));
    });

    await test('NEGATIVE: Unauthenticated user cannot list /users or /visits', async () => {
      await assertFails(getDocs(collection(unauthDb, 'users')));
      await assertFails(getDocs(collection(unauthDb, 'visits')));
    });

  } finally {
    await testEnv.cleanup();
  }

  console.log(`\n========================================`);
  console.log(`Rules Test Results: ${passedTests}/${totalTests} passed`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
