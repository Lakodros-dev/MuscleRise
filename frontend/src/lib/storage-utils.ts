// Storage utility functions with error handling and optimization

interface StorageOptions {
    compress?: boolean;
    ttl?: number; // Time to live in milliseconds
}

interface StorageItem {
    data: any;
    timestamp: number;
    ttl?: number;
}

class SafeStorage {
    private static instance: SafeStorage;
    private cache = new Map<string, any>();

    static getInstance(): SafeStorage {
        if (!SafeStorage.instance) {
            SafeStorage.instance = new SafeStorage();
        }
        return SafeStorage.instance;
    }

    setItem(key: string, value: any, options: StorageOptions = {}): boolean {
        try {
            const item: StorageItem = {
                data: value,
                timestamp: Date.now(),
                ttl: options.ttl
            };

            const serialized = JSON.stringify(item);
            localStorage.setItem(key, serialized);

            // Update cache
            this.cache.set(key, value);

            return true;
        } catch (error) {
            console.warn(`Failed to save to localStorage (${key}):`, error);

            // Try to free up space by removing old items
            this.cleanup();

            // Try again after cleanup
            try {
                const item: StorageItem = {
                    data: value,
                    timestamp: Date.now(),
                    ttl: options.ttl
                };
                localStorage.setItem(key, JSON.stringify(item));
                this.cache.set(key, value);
                return true;
            } catch (retryError) {
                console.error(`Failed to save to localStorage after cleanup (${key}):`, retryError);
                return false;
            }
        }
    }

    getItem<T = any>(key: string): T | null {
        try {
            // Check cache first
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const item: StorageItem = JSON.parse(stored);

            // Check if item has expired
            if (item.ttl && Date.now() - item.timestamp > item.ttl) {
                this.removeItem(key);
                return null;
            }

            // Update cache
            this.cache.set(key, item.data);

            return item.data;
        } catch (error) {
            console.warn(`Failed to read from localStorage (${key}):`, error);
            return null;
        }
    }

    removeItem(key: string): boolean {
        try {
            localStorage.removeItem(key);
            this.cache.delete(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove from localStorage (${key}):`, error);
            return false;
        }
    }

    clear(): boolean {
        try {
            localStorage.clear();
            this.cache.clear();
            return true;
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
            return false;
        }
    }

    // Clean up expired items
    cleanup(): void {
        try {
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    const stored = localStorage.getItem(key);
                    if (!stored) continue;

                    const item: StorageItem = JSON.parse(stored);

                    // Check if item has expired
                    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
                        keysToRemove.push(key);
                    }
                } catch (parseError) {
                    // If we can't parse the item, it might be corrupted, remove it
                    keysToRemove.push(key);
                }
            }

            // Remove expired/corrupted items
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                this.cache.delete(key);
            });

            console.log(`Cleaned up ${keysToRemove.length} expired/corrupted localStorage items`);
        } catch (error) {
            console.warn('Failed to cleanup localStorage:', error);
        }
    }

    // Get storage usage info
    getStorageInfo(): { used: number; available: number; percentage: number } {
        try {
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            // Estimate available space (most browsers have ~5-10MB limit)
            const estimated = 5 * 1024 * 1024; // 5MB
            const available = Math.max(0, estimated - used);
            const percentage = (used / estimated) * 100;

            return { used, available, percentage };
        } catch (error) {
            return { used: 0, available: 0, percentage: 0 };
        }
    }
}

export const safeStorage = SafeStorage.getInstance();

// Convenience functions
export const setStorageItem = (key: string, value: any, options?: StorageOptions) =>
    safeStorage.setItem(key, value, options);

export const getStorageItem = <T = any>(key: string): T | null =>
    safeStorage.getItem<T>(key);

export const removeStorageItem = (key: string) =>
    safeStorage.removeItem(key);

export const clearStorage = () =>
    safeStorage.clear();

// Auto cleanup on page load
if (typeof window !== 'undefined') {
    // Run cleanup on page load
    setTimeout(() => safeStorage.cleanup(), 1000);

    // Run cleanup periodically (every 30 minutes)
    setInterval(() => safeStorage.cleanup(), 30 * 60 * 1000);
}