import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  query,
  orderBy,
  limit,
  getDocs,
  arrayUnion,
  getCountFromServer,
  where,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config.js';

/**
 * Identify authentication provider name dynamically (whitelisted to 'google' | 'github' | 'email')
 */
export function getProviderName(user) {
  if (!user || !user.providerData || user.providerData.length === 0) {
    return 'email';
  }
  const providerId = user.providerData[0].providerId || '';
  if (providerId.includes('google')) return 'google';
  if (providerId.includes('github')) return 'github';
  return 'email';
}

/**
 * Record user profile in Firestore `users/{uid}` on successful authentication.
 * Tracks first visit, updates last visit, and increments login count.
 */
export async function syncUserProfile(user) {
  if (!db || !isFirebaseConfigured() || !user) return null;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const provider = getProviderName(user);

    const displayName = (user.displayName || user.email?.split('@')[0] || 'Visitor').substring(0, 256);
    const email = (user.email || '').substring(0, 256);
    const hasHttpsPhoto = typeof user.photoURL === 'string' && user.photoURL.startsWith('https://');

    if (!userSnap.exists()) {
      // First visit - create user document
      const initialData = {
        uid: user.uid,
        displayName,
        email,
        provider,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        loginCount: 1,
        lastSeenAt: serverTimestamp(),
        role: 'visitor'
      };

      if (hasHttpsPhoto && user.photoURL.length <= 2048) {
        initialData.photoURL = user.photoURL;
      }

      await setDoc(userRef, initialData);
      return initialData;
    } else {
      // Returning visitor - update existing document
      const updateData = {
        lastLoginAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        loginCount: increment(1)
      };

      if (user.displayName) {
        updateData.displayName = user.displayName.substring(0, 256);
      }
      if (hasHttpsPhoto && user.photoURL.length <= 2048) {
        updateData.photoURL = user.photoURL;
      }

      await updateDoc(userRef, updateData);
      return { ...userSnap.data(), ...updateData };
    }
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
    return null;
  }
}

/**
 * Guarded profile sync to ensure syncUserProfile runs at most once per browser session per uid
 */
export async function syncUserProfileOncePerSession(user) {
  if (!user || !user.uid) return null;
  const sessionKey = `synced_profile_${user.uid}`;
  try {
    if (sessionStorage.getItem(sessionKey)) {
      return null;
    }
  } catch (_) {
    // sessionStorage unavailable
  }

  try {
    const result = await syncUserProfile(user);
    try {
      sessionStorage.setItem(sessionKey, '1');
    } catch (_) {}
    return result;
  } catch (error) {
    try {
      sessionStorage.removeItem(sessionKey);
    } catch (_) {}
    throw error;
  }
}

/**
 * Update user's lastSeenAt timestamp
 */
export async function updateLastSeen(uid) {
  if (!db || !isFirebaseConfigured() || !uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastSeenAt: serverTimestamp()
    });
  } catch (err) {
    // Non-critical, ignore
  }
}

/**
 * Create a new visit session record in `visits/{visitId}`
 */
export async function createVisitRecord(user) {
  if (!db || !isFirebaseConfigured() || !user) return null;

  try {
    const visitsCol = collection(db, 'visits');
    const visitDoc = await addDoc(visitsCol, {
      uid: user.uid,
      visitorName: (user.displayName || user.email?.split('@')[0] || 'Visitor').substring(0, 256),
      visitorEmail: (user.email || '').substring(0, 256),
      startedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      page: (window.location.pathname || '/').substring(0, 256),
      sectionsViewed: ['landing'],
      userAgent: (navigator.userAgent || '').substring(0, 150),
      referrer: (document.referrer || 'direct').substring(0, 256)
    });

    return visitDoc.id;
  } catch (error) {
    console.error('Error creating visit record:', error);
    return null;
  }
}

/**
 * Record activity or section view for an active visit session.
 * Accepts an array of sections or a single section string.
 */
export async function updateVisitActivity(visitId, sections) {
  if (!db || !isFirebaseConfigured() || !visitId || !sections) return;

  const sectionsArray = (Array.isArray(sections) ? sections : [sections])
    .filter(s => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 20);

  if (!sectionsArray.length) return;

  try {
    const visitRef = doc(db, 'visits', visitId);
    await updateDoc(visitRef, {
      sectionsViewed: arrayUnion(...sectionsArray),
      lastActivityAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Error updating visit activity:', error.message);
  }
}

/**
 * Fetch all visitors and visits for the Admin Dashboard
 */
export async function getAdminVisitorData() {
  if (!db || !isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }

  const usersCol = collection(db, 'users');
  const visitsCol = collection(db, 'visits');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  /**
   * Note on Firestore Composite Indexes:
   * The count queries below use single-field filters:
   * - where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
   * - where('loginCount', '>', 1)
   * - where('startedAt', '>=', Timestamp.fromDate(startOfToday))
   * These utilize Firestore's automatic single-field indexes without needing composite indexes.
   * If any query combines multiple inequality filters or combines where() with an orderBy()
   * on a different field, composite indexes would be required.
   */
  const [
    totalUsersSnap,
    newUsersSnap,
    returningUsersSnap,
    visitsTodaySnap,
    usersSnap,
    visitsSnap
  ] = await Promise.all([
    getCountFromServer(usersCol),
    getCountFromServer(query(usersCol, where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)))),
    getCountFromServer(query(usersCol, where('loginCount', '>', 1))),
    getCountFromServer(query(visitsCol, where('startedAt', '>=', Timestamp.fromDate(startOfToday)))),
    getDocs(query(usersCol, orderBy('lastLoginAt', 'desc'), limit(200))),
    getDocs(query(visitsCol, orderBy('startedAt', 'desc'), limit(50))).catch(err => {
      console.warn('Visits query notice:', err.message);
      return { forEach: () => {} };
    })
  ]);

  const visitors = [];
  usersSnap.forEach(docSnap => {
    visitors.push({ id: docSnap.id, ...docSnap.data() });
  });

  const visits = [];
  visitsSnap.forEach(docSnap => {
    visits.push({ id: docSnap.id, ...docSnap.data() });
  });

  return {
    visitors,
    visits,
    stats: {
      totalVisitors: totalUsersSnap.data().count,
      newVisitors: newUsersSnap.data().count,
      visitsToday: visitsTodaySnap.data().count,
      returningVisitors: returningUsersSnap.data().count
    }
  };
}
