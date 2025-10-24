// API configuration
const getApiBaseUrl = () => {
  // In development, use Vite proxy (empty string) or fallback to localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || '';
  }

  // In production, use environment variable or throw error
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.error('❌ VITE_API_URL environment variable is not set in production!');
    throw new Error('Backend API URL is not configured. Please set VITE_API_URL environment variable.');
  }

  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth token management
class AuthTokenManager {
  private static instance: AuthTokenManager;
  private token: string | null = null;

  static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    console.log('🔐 AuthManager: Token check -', this.token ? 'Token exists' : 'No token found');
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    const hasToken = !!this.getToken();
    console.log('🔐 AuthManager: Authentication check -', hasToken ? 'Authenticated' : 'Not authenticated');
    return hasToken;
  }
}

export const authManager = AuthTokenManager.getInstance();

// Enhanced request cache with TTL
interface CacheEntry {
  promise: Promise<ApiResponse<any>>;
  timestamp: number;
  ttl: number;
}

const requestCache = new Map<string, CacheEntry>();
const defaultCacheTTL = 30000; // 30 seconds
const userDataCacheTTL = 60000; // 1 minute for user data

// Cleanup expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      requestCache.delete(key);
    }
  }
};

// Run cleanup every 30 seconds
setInterval(cleanupCache, 30000);

// Clear cache for specific patterns
export const clearCachePattern = (pattern: string) => {
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key);
    }
  }
};

export async function makeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  useCache: boolean = false,
  cacheTTL?: number
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const cacheKey = `${url}-${JSON.stringify(options)}`;

  // Return cached promise if available and caching is enabled
  if (useCache && options.method !== 'POST' && options.method !== 'PATCH' && options.method !== 'DELETE') {
    const cachedEntry = requestCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < cachedEntry.ttl) {
      console.log('📦 Using cached response for:', endpoint);
      return cachedEntry.promise;
    }
  }

  const requestPromise = performRequest<T>(url, options);

  // Cache the promise for GET requests
  if (useCache && (!options.method || options.method === 'GET')) {
    const ttl = cacheTTL || (endpoint.includes('/auth/') ? userDataCacheTTL : defaultCacheTTL);
    requestCache.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now(),
      ttl
    });
  }

  return requestPromise;
}

async function performRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<ApiResponse<T>> {
  const maxRetries = 3;
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

  // Track API performance
  const { trackApiRequest } = await import("@/lib/performance-utils");
  const tracker = trackApiRequest(url, options.method || 'GET');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Add auth token to headers if available
    const token = authManager.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Frontend: Token added to request headers');
    } else {
      console.log('⚠️ Frontend: No token available for request');
    }

    console.log(`📡 Frontend: Making request to: ${url}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

    const response = await fetch(url, {
      headers,
      credentials: 'include', // Include cookies
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle authentication errors
    if (response.status === 401) {
      console.log('❌ Frontend: 401 Unauthorized - clearing token');
      authManager.clearToken();
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    if (!response.ok) {
      console.log(`❌ Frontend: Request failed with status ${response.status}:`, data);
      return {
        success: false,
        error: (typeof data === 'object' && data.error) || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    tracker.end();
    return {
      success: true,
      data,
    };
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      if (retryCount < maxRetries) {
        console.log(`⏳ Request timeout, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return performRequest<T>(url, options, retryCount + 1);
      }
      return {
        success: false,
        error: 'Request timeout - please try again',
      };
    }

    // Handle network errors with retry
    if (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )) {
      if (retryCount < maxRetries) {
        console.log(`🔄 Network error, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return performRequest<T>(url, options, retryCount + 1);
      }
    }

    tracker.recordError();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// Auth API functions
export async function registerUser(userData: {
  username: string;
  password: string;
  weightKg: number;
  heightCm: number;
  avatarUrl?: string;
  planId: string;
  customExercises?: any[];
}): Promise<ApiResponse<{ user: any; token: string }>> {
  const response = await makeApiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (response.success && response.data?.token) {
    authManager.setToken(response.data.token);
  }

  return response;
}

export async function loginUser(username: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
  const response = await makeApiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (response.success && response.data?.token) {
    authManager.setToken(response.data.token);
  }

  return response;
}

export async function logoutUser(): Promise<ApiResponse> {
  const response = await makeApiRequest('/auth/logout', {
    method: 'POST',
  });

  authManager.clearToken();
  return response;
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
  return makeApiRequest('/auth/me', {}, false); // Don't use cache to get fresh user data
}

export async function updateUser(userId: string, updates: any): Promise<ApiResponse<{ user: any }>> {
  const response = await makeApiRequest(`/auth/user/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  // Clear only user-related cache after update
  clearCachePattern('/auth/user');
  clearCachePattern('/auth/me');

  return response;
}

export async function refreshToken(): Promise<ApiResponse<{ user: any; token: string }>> {
  const currentToken = authManager.getToken();
  if (!currentToken) {
    return { success: false, error: 'No token to refresh' };
  }

  const response = await makeApiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token: currentToken }),
  });

  if (response.success && response.data?.token) {
    authManager.setToken(response.data.token);
  }

  return response;
}

export function getValidationErrorMessage(error: string): string {
  if (error.toLowerCase().includes('username')) {
    return 'Username is already taken or invalid';
  }
  if (error.toLowerCase().includes('password')) {
    return 'Password is invalid or too weak';
  }
  if (error.toLowerCase().includes('missing required fields')) {
    return 'Please fill in all required fields';
  }
  if (error.toLowerCase().includes('invalid credentials')) {
    return 'Invalid username or password';
  }
  return error;
}

export function handleApiError(error: string, setErrors: (errors: Record<string, string>) => void): void {
  const message = getValidationErrorMessage(error);

  if (message.toLowerCase().includes('username')) {
    setErrors({ username: message });
  } else if (message.toLowerCase().includes('password')) {
    setErrors({ password: message });
  } else {
    setErrors({ general: message });
  }
}

// Workout API functions
export async function completeWorkout(workoutData: {
  exercises: Array<{
    id: string;
    name: string;
    targetReps: number;
    completedReps: number;
    caloriesBurned?: number;
  }>;
  totalCalories?: number;
  duration?: number;
  planId?: string;
}): Promise<ApiResponse<{
  workoutId: string;
  coinsEarned: number;
  totalCalories: number;
  streak: number;
  user: any;
}>> {
  const response = await makeApiRequest('/workouts/complete', {
    method: 'POST',
    body: JSON.stringify(workoutData),
  });

  // Clear user cache after workout completion
  clearCachePattern('/auth/user');
  clearCachePattern('/auth/me');
  clearCachePattern('/workouts');

  return response;
}

export async function getWorkoutHistory(): Promise<ApiResponse<{
  history: any[];
  totalWorkouts: number;
  totalCalories: number;
}>> {
  return makeApiRequest('/workouts/history', {}, true);
}

export async function getTodayWorkoutStats(): Promise<ApiResponse<{
  todayStats: {
    workoutsCompleted: number;
    totalCalories: number;
    totalExercises: number;
    totalDuration: number;
  };
}>> {
  return makeApiRequest('/workouts/today', {}, true);
}

export async function deleteWorkout(workoutId: string): Promise<ApiResponse> {
  const response = await makeApiRequest(`/workouts/${workoutId}`, {
    method: 'DELETE',
  });

  // Clear cache after deletion
  clearCachePattern('/workouts');
  clearCachePattern('/auth/user');

  return response;
}