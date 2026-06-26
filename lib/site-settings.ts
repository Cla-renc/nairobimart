import prisma from './prisma';
import { getCachedValue, setCachedValue } from './server-cache';

const CACHE_KEY = 'site-settings-map';
const CACHE_TTL = 60_000; // 60s

export async function getSiteSettingsMap(): Promise<Record<string, string>> {
  const cached = getCachedValue<Record<string, string>>(CACHE_KEY);
  if (cached) return cached;

  const rows = await prisma.siteSettings.findMany({ select: { key: true, value: true } });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  setCachedValue(CACHE_KEY, map, CACHE_TTL);
  return map;
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const map = await getSiteSettingsMap();
  return map[key] ?? fallback;
}

export async function clearSiteSettingsCache() {
  setCachedValue(CACHE_KEY, {}, 0);
}
