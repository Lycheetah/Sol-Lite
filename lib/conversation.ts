import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MESSAGES: 'sol_lite_messages',
  MESSAGE_COUNT: 'sol_lite_message_count',
};

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function loadConversation(): Promise<StoredMessage[]> {
  const raw = await AsyncStorage.getItem(KEYS.MESSAGES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveConversation(messages: StoredMessage[]): Promise<void> {
  // Keep last 50 messages only
  const toSave = messages.filter(m => m.id !== 'welcome').slice(-50);
  await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(toSave));
}

export async function clearConversation(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.MESSAGES);
  await AsyncStorage.removeItem(KEYS.MESSAGE_COUNT);
}

export async function getTodayMessageCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.MESSAGE_COUNT);
  if (!raw) return 0;
  const { date, count } = JSON.parse(raw);
  const today = new Date().toISOString().split('T')[0];
  return date === today ? count : 0;
}

export async function incrementTodayMessageCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const current = await getTodayMessageCount();
  const newCount = current + 1;
  await AsyncStorage.setItem(KEYS.MESSAGE_COUNT, JSON.stringify({ date: today, count: newCount }));
  return newCount;
}
