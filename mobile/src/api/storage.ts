import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage with AsyncStorage fallback (e.g. web / SecureStore failures).
 */

export async function storageSetItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    return;
  } catch {
    // Fall through to AsyncStorage
  }
  await AsyncStorage.setItem(key, value);
}

export async function storageGetItem(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value != null) return value;
  } catch {
    // Fall through to AsyncStorage
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function storageDeleteItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore SecureStore errors
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore AsyncStorage errors
  }
}
