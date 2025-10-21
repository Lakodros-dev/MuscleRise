export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request cache for avoiding duplicate calls
const requestCache = new Map<string, Promise<ApiResponse<any>>>();
const cacheTimeout = 30000; // 30 seconds

// Cleanup cache entries after timeout
setInterval(() => {
  requestCache.clear();
}, cacheTimeout);

export async function makeApiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  useCache: boolean = false
): Promise<ApiResponse<T>> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Return cached promise if available and caching is enabled
  if (useCache && options.method !== 'POST' && options.method !== 'PATCH' && options.method !== 'DELETE') {
    const cachedRequest = requestCache.get(cacheKey);
    if (cachedRequest) {
      return cachedRequest;
    }
  }
  
  const requestPromise = performRequest<T>(url, options);
  
  // Cache the promise for GET requests
  if (useCache && (!options.method || options.method === 'GET')) {
    requestCache.set(cacheKey, requestPromise);
    // Clean up cache entry after timeout
    setTimeout(() => requestCache.delete(cacheKey), cacheTimeout);
  }
  
  return requestPromise;
}

async function performRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

    if (!response.ok) {
      return {
        success: false,
        error: (typeof data === 'object' && data.error) || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - please try again',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
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