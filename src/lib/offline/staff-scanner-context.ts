export type CachedStaffScannerContext = {
  assignmentId?: string | null;

  eventId: string;
  eventTitle?: string | null;

  checkpointId: string;
  checkpointName?: string | null;
  checkpointType?: string | null;

  deviceId: string;
  deviceName?: string | null;
  deviceCode?: string | null;
  deviceApiKey?: string | null;

  staffSessionId?: string | null;

  savedAt: string;
};

const CACHE_KEY = "staff-scanner:last-context";

export function saveStaffScannerContext(context: CachedStaffScannerContext) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CACHE_KEY, JSON.stringify(context));
}

export function getSavedStaffScannerContext() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedStaffScannerContext;

    if (!parsed.eventId || !parsed.checkpointId || !parsed.deviceId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedStaffScannerContext() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CACHE_KEY);
}
