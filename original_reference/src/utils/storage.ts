/**
 * Safe storage utility with in-memory fallback.
 * Prevents crashes in Safari Private Browsing, disabled cookies/storage,
 * or quota-exceeded environments.
 */

class SafeStorage {
  private memoryFallback: Map<string, string> = new Map();
  private isLocalStorageAvailable: boolean;

  constructor() {
    this.isLocalStorageAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    if (this.isLocalStorageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.memoryFallback.get(key) ?? null;
      }
    }
    return this.memoryFallback.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.memoryFallback.set(key, value);
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn('Storage quota exceeded or storage blocked. Using memory fallback.', e);
      }
    }
  }

  public removeItem(key: string): void {
    this.memoryFallback.delete(key);
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    }
  }
}

export const safeStorage = new SafeStorage();
