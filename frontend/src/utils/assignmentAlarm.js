let audioCtx = null;

function getAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function playTone(ctx, start, frequency, duration) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

/** Two-tone repeating alarm so assignment is hard to miss. */
export function unlockAssignmentAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (_) {
    // ignore
  }
}
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i += 1) {
      const start = now + i * 0.42;
      playTone(ctx, start, 920, 0.16);
      playTone(ctx, start + 0.18, 620, 0.16);
    }
  } catch (_) {
    // Ignore autoplay restrictions
  }
}

export function requestAlarmNotificationPermission() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return;
  }
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function showAssignmentBrowserNotification(title, body) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return;
  }
  if (Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, {
      body,
      requireInteraction: true,
      tag: 'cn-job-assignment',
    });
  } catch (_) {
    // ignore
  }
}

export function isJobAssignmentNotification(notification) {
  if (!notification) return false;
  return (
    notification.category === 'JOB_ASSIGNMENT' ||
    notification.metadata?.playAlarm === true
  );
}
