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
  arrayUnion
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config.js';

/**
 * Identify authentication provider name dynamically
 */
export function getProviderName(user) {
  if (!user || !user.providerData || user.providerData.length === 0) {
    return 'email';
  }
  const providerId = user.providerData[0].providerId;
  if (providerId.includes('google')) return 'google';
  if (providerId.includes('github')) return 'github';
  if (providerId.includes('password')) return 'email';
  return providerId;
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

    if (!userSnap.exists()) {
      // First visit - create user document
      const initialData = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Visitor',
        email: user.email || '',
        photoURL: user.photoURL || '',
        provider: provider,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        loginCount: 1,
        lastSeenAt: serverTimestamp(),
        role: 'visitor'
      };

      await setDoc(userRef, initialData);
      return initialData;
    } else {
      // Returning visitor - update existing document
      const updateData = {
        lastLoginAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        loginCount: increment(1)
      };

      // Keep profile up to date if OAuth provides newer name/photo
      if (user.displayName) updateData.displayName = user.displayName;
      if (user.photoURL) updateData.photoURL = user.photoURL;

      await updateDoc(userRef, updateData);
      return { ...userSnap.data(), ...updateData };
    }
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
    return null;
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
      visitorName: user.displayName || user.email?.split('@')[0] || 'Visitor',
      visitorEmail: user.email || '',
      startedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      page: window.location.pathname || '/',
      sectionsViewed: ['landing'],
      userAgent: navigator.userAgent.substring(0, 150),
      referrer: document.referrer || 'direct'
    });

    return visitDoc.id;
  } catch (error) {
    console.error('Error creating visit record:', error);
    return null;
  }
}

/**
 * Record activity or section view for an active visit session
 */
export async function updateVisitActivity(visitId, sectionId) {
  if (!db || !isFirebaseConfigured() || !visitId || !sectionId) return;

  try {
    const visitRef = doc(db, 'visits', visitId);
    await updateDoc(visitRef, {
      sectionsViewed: arrayUnion(sectionId),
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

  // Fetch users ordered by lastLoginAt
  const usersQuery = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'), limit(200));
  const usersSnap = await getDocs(usersQuery);

  const visitors = [];
  usersSnap.forEach(docSnap => {
    visitors.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Fetch recent visits
  let visits = [];
  try {
    const visitsQuery = query(collection(db, 'visits'), orderBy('startedAt', 'desc'), limit(100));
    const visitsSnap = await getDocs(visitsQuery);
    visitsSnap.forEach(docSnap => {
      visits.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (e) {
    console.warn('Visits query notice:', e.message);
  }

  // Calculate statistics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const totalVisitors = visitors.length;
  let newVisitors = 0;
  let returningVisitors = 0;
  let visitsToday = 0;

  visitors.forEach(v => {
    const createdTime = v.createdAt?.toMillis ? v.createdAt.toMillis() : null;
    const loginCount = v.loginCount || 1;

    if (createdTime && createdTime >= sevenDaysAgo) {
      newVisitors++;
    }
    if (loginCount > 1) {
      returningVisitors++;
    }
  });

  visits.forEach(v => {
    const startTime = v.startedAt?.toMillis ? v.startedAt.toMillis() : null;
    if (startTime && startTime >= startOfToday) {
      visitsToday++;
    }
  });

  return {
    visitors,
    visits,
    stats: {
      totalVisitors,
      newVisitors,
      visitsToday: visitsToday || visitors.filter(v => v.lastLoginAt?.toMillis && v.lastLoginAt.toMillis() >= startOfToday).length,
      returningVisitors
    }
  };
}
