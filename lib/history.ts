import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

import type { DamageAnalysis } from '@/lib/openai';

const HISTORY_DIRECTORY = `${FileSystem.documentDirectory ?? ''}history`;
const HISTORY_FALLBACK_PREFIX = 'cardamageanalyzer.history.';
const MAX_HISTORY_ITEMS = 200;

let memoryHistory: Record<string, string> = {};

export type AnalysisHistoryPhoto = {
  uri: string;
  fileName?: string | null;
};

export type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
  userEmail: string;
  vehicleLabel: string;
  summary: string;
  damagedZones: string[];
  totalAmount: string;
  currency: string;
  estimateNote: string;
  photos: AnalysisHistoryPhoto[];
  lineItems: DamageAnalysis['lineItems'];
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getFallbackKey(email: string) {
  return `${HISTORY_FALLBACK_PREFIX}${normalizeEmail(email)}`;
}

function getHistoryFileUri(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const safeName = normalizedEmail.replace(/[^a-z0-9._-]/gi, '_');
  return `${HISTORY_DIRECTORY}/${safeName}.json`;
}

async function safeGetSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryHistory[key] ?? null;
  }
}

async function safeSetSecureItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryHistory[key] = value;
  }
}

async function ensureHistoryDirectory() {
  if (!FileSystem.documentDirectory) {
    return false;
  }

  const info = await FileSystem.getInfoAsync(HISTORY_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(HISTORY_DIRECTORY, { intermediates: true });
  }

  return true;
}

async function readHistoryRaw(email: string): Promise<string | null> {
  try {
    const hasDirectory = await ensureHistoryDirectory();

    if (hasDirectory) {
      const fileUri = getHistoryFileUri(email);
      const info = await FileSystem.getInfoAsync(fileUri);

      if (info.exists && !info.isDirectory) {
        return await FileSystem.readAsStringAsync(fileUri);
      }
    }
  } catch {
    // Fall back to other storage layers below.
  }

  const fallbackKey = getFallbackKey(email);
  return await safeGetSecureItem(fallbackKey);
}

async function writeHistoryRaw(email: string, value: string) {
  let wroteToFile = false;

  try {
    const hasDirectory = await ensureHistoryDirectory();

    if (hasDirectory) {
      const fileUri = getHistoryFileUri(email);
      await FileSystem.writeAsStringAsync(fileUri, value);
      wroteToFile = true;
    }
  } catch {
    wroteToFile = false;
  }

  await safeSetSecureItem(getFallbackKey(email), value);

  if (!wroteToFile) {
    memoryHistory[getFallbackKey(email)] = value;
  }
}

export async function getAnalysisHistory(email: string): Promise<AnalysisHistoryItem[]> {
  const raw = await readHistoryRaw(email);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AnalysisHistoryItem[];
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          estimateNote:
            item.estimateNote ||
            'Орієнтовна сума розрахована локально за каталогом деталей і робіт.',
        }))
      : [];
  } catch {
    return [];
  }
}

export async function getAnalysisHistoryItem(email: string, id: string) {
  const history = await getAnalysisHistory(email);
  return history.find((item) => item.id === id) ?? null;
}

export async function deleteAnalysisHistoryItem(email: string, id: string) {
  const normalizedEmail = normalizeEmail(email);
  const currentHistory = await getAnalysisHistory(normalizedEmail);
  const nextHistory = currentHistory.filter((item) => item.id !== id);

  await writeHistoryRaw(normalizedEmail, JSON.stringify(nextHistory));
}

export async function saveAnalysisHistory(params: {
  email: string;
  analysis: DamageAnalysis;
  photos: AnalysisHistoryPhoto[];
}) {
  const { email, analysis, photos } = params;
  const normalizedEmail = normalizeEmail(email);
  const currentHistory = await getAnalysisHistory(normalizedEmail);

  const nextItem: AnalysisHistoryItem = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    userEmail: normalizedEmail,
    vehicleLabel: analysis.vehicle.makeModel,
    summary: analysis.damageSummary,
    damagedZones: analysis.damagedZones,
    totalAmount: analysis.estimatedCost.amount,
    currency: analysis.estimatedCost.currency,
    estimateNote: analysis.estimatedCost.note,
    photos,
    lineItems: analysis.lineItems,
  };

  const nextHistory = [nextItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
  await writeHistoryRaw(normalizedEmail, JSON.stringify(nextHistory));
}
