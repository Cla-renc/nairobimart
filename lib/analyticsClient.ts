declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {
    // ignore
  }
}

export function getGaClientId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/_ga=([^;]+)/);
  if (!match) return null;
  const ga = decodeURIComponent(match[1]);
  // _ga usually looks like GA1.2.XXXXXXXXXX.YYYYYYYYYY
  const parts = ga.split('.');
  if (parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }
  return null;
}
