import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ETA_FILTER,
  isValidEtaFilter,
  type EtaFilterValue,
} from './etaUrgency';

const prefsKey = (userId: string) => `cn_terminal_user_prefs_${userId}`;

type UserPrefs = {
  defaultEtaFilter?: EtaFilterValue;
};

export async function getUserPreferences(userId?: string | null): Promise<UserPrefs> {
  if (!userId) return {};
  try {
    const raw = await AsyncStorage.getItem(prefsKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function setUserPreferences(
  userId: string | null | undefined,
  patch: UserPrefs,
): Promise<UserPrefs> {
  if (!userId) return {};
  const next = { ...(await getUserPreferences(userId)), ...patch };
  await AsyncStorage.setItem(prefsKey(userId), JSON.stringify(next));
  return next;
}

export async function getDefaultEtaFilter(
  userId?: string | null,
): Promise<EtaFilterValue> {
  const value = (await getUserPreferences(userId)).defaultEtaFilter;
  return isValidEtaFilter(value) ? value : ETA_FILTER.ALL;
}

export async function setDefaultEtaFilter(
  userId: string | null | undefined,
  filter: string,
): Promise<EtaFilterValue> {
  const value = isValidEtaFilter(filter) ? filter : ETA_FILTER.ALL;
  await setUserPreferences(userId, { defaultEtaFilter: value });
  return value;
}
