// Thin wrapper around localStorage. Everything Rasoibox saves lives under the "rasoibox_" prefix.
// NOTE: localStorage is per-browser, per-site and limited to roughly 5 MB. Nothing here is secure.
export const PREFIX = 'rasoibox_';

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    window.dispatchEvent(new CustomEvent('rasoibox:storage-error', { detail: err }));
    return false;
  }
}

// Session: kept in localStorage when "keep me signed in" is on, otherwise in sessionStorage.
export function getSessionUserId() {
  try {
    return (
      JSON.parse(localStorage.getItem(PREFIX + 'session') || 'null')?.userId ||
      JSON.parse(sessionStorage.getItem(PREFIX + 'session') || 'null')?.userId ||
      null
    );
  } catch {
    return null;
  }
}

export function setSessionUserId(userId, remember = true) {
  clearSession();
  try {
    (remember ? localStorage : sessionStorage).setItem(PREFIX + 'session', JSON.stringify({ userId }));
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(PREFIX + 'session');
    sessionStorage.removeItem(PREFIX + 'session');
  } catch {
    /* ignore */
  }
}

export function clearAllGharseData() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function storageUsageKB() {
  try {
    let bytes = 0;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(PREFIX)) bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
    });
    return Math.round(bytes / 1024);
  } catch {
    return 0;
  }
}
