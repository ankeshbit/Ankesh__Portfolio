import { createVisitRecord, updateVisitActivity, updateLastSeen } from '../firebase/firestore.js';

let activeVisitId = null;
let currentUid = null;
let viewedSections = new Set(['landing']);
let pendingSections = new Set();
let observer = null;
let updateTimeout = null;
let heartbeatIntervalId = null;
let lastWriteTime = 0;
const MIN_WRITE_INTERVAL_MS = 20000; // at most 1 write every 20 seconds

/**
 * Flush any queued section views to Firestore in a single batch
 */
function flushPendingSections() {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }

  if (!activeVisitId || pendingSections.size === 0) return;

  const sectionsToSend = Array.from(pendingSections);
  pendingSections.clear();
  lastWriteTime = Date.now();
  updateVisitActivity(activeVisitId, sectionsToSend);
}

// Flush pending section views when leaving or hiding the page
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushPendingSections();
  }
});

window.addEventListener('pagehide', () => {
  flushPendingSections();
});

/**
 * Initialize visitor tracking session
 */
export async function startVisitorTracking(user) {
  if (!user || user.uid === currentUid) return;

  currentUid = user.uid;
  viewedSections = new Set(['landing']);
  pendingSections.clear();

  try {
    const visitId = await createVisitRecord(user);
    // Discard result if session was stopped or switched while awaiting creation
    if (currentUid !== user.uid) {
      return;
    }
    activeVisitId = visitId;
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
  flushPendingSections();

  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
  pendingSections.clear();
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
 * Queue activity update with single pending timer and pendingSections batching
 */
function queueActivityUpdate(sectionId) {
  if (sectionId) {
    pendingSections.add(sectionId);
  }

  if (!activeVisitId) return;

  if (!updateTimeout) {
    const now = Date.now();
    const timeSinceLastWrite = now - lastWriteTime;
    const delay = Math.max(0, MIN_WRITE_INTERVAL_MS - timeSinceLastWrite);

    updateTimeout = setTimeout(() => {
      flushPendingSections();
    }, delay);
  }
}

/**
 * Periodic lastSeenAt heartbeat without interval leaks
 */
function setupHeartbeat(uid) {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }

  const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
  heartbeatIntervalId = setInterval(() => {
    if (currentUid === uid && document.visibilityState === 'visible') {
      updateLastSeen(uid);
    }
  }, HEARTBEAT_INTERVAL_MS);
}
