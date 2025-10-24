import { useCallback, useRef } from 'react';
import { makeApiRequest, ApiResponse } from '../lib/api-utils';

interface UseApiOptions {
  defaultDelay?: number;
  maxRetries?: number;
}

export function useApiRequest(options: UseApiOptions = {}) {
  const { defaultDelay = 500, maxRetries = 3 } = options;
  const requestQueue = useRef<Map<string, AbortController>>(new Map());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cancel pending request by key
  const cancelRequest = useCallback((key: string) => {
    const controller = requestQueue.current.get(key);
    if (controller) {
      controller.abort();
      requestQueue.current.delete(key);
    }

    const timer = debounceTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.current.delete(key);
    }
  }, []);

  // Debounced API request
  const debouncedRequest = useCallback(async <T = any>(
    key: string,
    url: string,
    options: RequestInit = {},
    delay: number = defaultDelay
  ): Promise<ApiResponse<T>> => {
    return new Promise((resolve) => {
      // Cancel previous request with same key
      cancelRequest(key);

      const timer = setTimeout(async () => {
        try {
          const controller = new AbortController();
          requestQueue.current.set(key, controller);

          const response = await makeApiRequest<T>(url, {
            ...options,
            signal: controller.signal,
          });

          requestQueue.current.delete(key);
          debounceTimers.current.delete(key);
          resolve(response);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            resolve({ success: false, error: 'Request cancelled' });
          } else {
            resolve({ success: false, error: 'Request failed' });
          }
        }
      }, delay);

      debounceTimers.current.set(key, timer);
    });
  }, [defaultDelay, cancelRequest]);

  // Request with retry logic
  const requestWithRetry = useCallback(async <T = any>(
    url: string,
    options: RequestInit = {},
    retries: number = maxRetries
  ): Promise<ApiResponse<T>> => {
    let lastError = 'Unknown error';
    
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await makeApiRequest<T>(url, options);
        if (response.success) {
          return response;
        }
        lastError = response.error || 'Request failed';
        
        // Don't retry on client errors (4xx)
        if (response.error?.includes('HTTP 4')) {
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
      }

      // Wait before retry (exponential backoff)
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    return { success: false, error: lastError };
  }, [maxRetries]);

  // Batch multiple requests
  const batchRequests = useCallback(async <T = any>(
    requests: Array<{ url: string; options?: RequestInit }>
  ): Promise<Array<ApiResponse<T>>> => {
    const promises = requests.map(({ url, options }) => 
      makeApiRequest<T>(url, options)
    );
    
    return Promise.allSettled(promises).then(results =>
      results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { success: false, error: 'Request failed' }
      )
    );
  }, []);

  // Clean up on unmount
  const cleanup = useCallback(() => {
    requestQueue.current.forEach(controller => controller.abort());
    debounceTimers.current.forEach(timer => clearTimeout(timer));
    requestQueue.current.clear();
    debounceTimers.current.clear();
  }, []);

  return {
    debouncedRequest,
    requestWithRetry,
    batchRequests,
    cancelRequest,
    cleanup,
  };
}

// Singleton API client for app-wide usage
export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return makeApiRequest<T>(url, {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    });
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}