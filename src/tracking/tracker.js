import { createVisitRecord, updateVisitActivity, updateLastSeen } from '../firebase/firestore.js';

let activeVisitId = null;
let currentUid = null;
let viewedSections = new Set(['landing']);
let observer = null;
let updateTimeout = null;
let lastWriteTime = 0;
const MIN_WRITE_INTERVAL_MS = 20000; // at most 1 write every 20 seconds

/**
 * Initialize visitor tracking session
 */
export async function startVisitorTracking(user) {
  if (!user || user.uid === currentUid) return;

  currentUid = user.uid;
  viewedSections = new Set(['landing']);

  try {
    activeVisitId = await createVisitRecord(user);
    attachSectionObserver();
    setupHeartbeat(user.uid);
  } catch (err) {
    console.warn('Visitor tracking initialization notice:', err);
  }
}

/**
 * Stop tracking session
 */
export function stopVisitorTracking() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }
  activeVisitId = null;
  currentUid = null;
}

/**
 * Observe scroll into portfolio sections
 */
function attachSectionObserver() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  if (!sections.length) return;

  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        if (sectionId && !viewedSections.has(sectionId)) {
          viewedSections.add(sectionId);
          queueActivityUpdate(sectionId);
        }
      }
    });
  }, {
    threshold: 0.25
  });

  sections.forEach(sec => observer.observe(sec));
}

/**
 * Debounce/throttle activity writes to Firestore
 */
function queueActivityUpdate(sectionId) {
  if (!activeVisitId) return;

  const now = Date.now();
  const timeSinceLastWrite = now - lastWriteTime;

  if (timeSinceLastWrite >= MIN_WRITE_INTERVAL_MS) {
    lastWriteTime = now;
    updateVisitActivity(activeVisitId, sectionId);
  } else {
    // Queue update after remaining cooldown
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      lastWriteTime = Date.now();
      updateVisitActivity(activeVisitId, sectionId);
    }, MIN_WRITE_INTERVAL_MS - timeSinceLastWrite);
  }
}

/**
 * Periodic lastSeenAt heartbeat
 */
function setupHeartbeat(uid) {
  const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
  setInterval(() => {
    if (currentUid === uid && document.visibilityState === 'visible') {
      updateLastSeen(uid);
    }
  }, HEARTBEAT_INTERVAL_MS);
}
