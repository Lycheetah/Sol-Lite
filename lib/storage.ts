import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_NAME: 'sol_lite_user_name',
  BYOK_KEY: 'sol_lite_byok_key',
  ONBOARDING_DONE: 'sol_lite_onboarding_done',
  STREAK_LAST_ACTIVE: 'sol_lite_streak_last',
  STREAK_COUNT: 'sol_lite_streak_count',
  SELECTED_PATH: 'sol_lite_path',
  SAVED_REFLECTIONS: 'sol_lite_reflections',
  FIELD_STATE: 'sol_lite_field_state',
};

export async function getUserName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_NAME);
}
export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
}

export async function getByokKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.BYOK_KEY);
}
export async function setByokKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.BYOK_KEY, key);
}

export async function isOnboardingDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.ONBOARDING_DONE)) === 'true';
}
export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export async function getSelectedPath(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.SELECTED_PATH)) ?? 'none';
}
export async function setSelectedPath(path: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SELECTED_PATH, path);
}

export async function updateStreak(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = await AsyncStorage.getItem(KEYS.STREAK_LAST_ACTIVE);
  const countStr = await AsyncStorage.getItem(KEYS.STREAK_COUNT);
  let count = countStr ? parseInt(countStr) : 0;

  if (lastActive === today) return count;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  count = lastActive === yesterdayStr ? count + 1 : 1;

  await AsyncStorage.setItem(KEYS.STREAK_LAST_ACTIVE, today);
  await AsyncStorage.setItem(KEYS.STREAK_COUNT, String(count));
  return count;
}

export async function getStreak(): Promise<number> {
  const countStr = await AsyncStorage.getItem(KEYS.STREAK_COUNT);
  return countStr ? parseInt(countStr) : 0;
}

export interface SavedReflection {
  id: string;
  text: string;
  date: string;
  path: string;
}

export async function getSavedReflections(): Promise<SavedReflection[]> {
  const raw = await AsyncStorage.getItem(KEYS.SAVED_REFLECTIONS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveReflection(text: string, path: string): Promise<void> {
  const existing = await getSavedReflections();
  const entry: SavedReflection = {
    id: Date.now().toString(),
    text,
    date: new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
    path,
  };
  await AsyncStorage.setItem(KEYS.SAVED_REFLECTIONS, JSON.stringify([entry, ...existing].slice(0, 100)));
}

export async function deleteReflection(id: string): Promise<void> {
  const existing = await getSavedReflections();
  await AsyncStorage.setItem(KEYS.SAVED_REFLECTIONS, JSON.stringify(existing.filter(r => r.id !== id)));
}

export type FieldState = 'rubedo' | 'albedo' | 'nigredo' | 'citrinitas';

export async function getFieldState(): Promise<FieldState> {
  return ((await AsyncStorage.getItem(KEYS.FIELD_STATE)) ?? 'rubedo') as FieldState;
}
export async function setFieldState(state: FieldState): Promise<void> {
  await AsyncStorage.setItem(KEYS.FIELD_STATE, state);
}
