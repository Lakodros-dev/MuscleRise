// Performance monitoring and optimization utilities
import React from 'react';

interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    type: 'timing' | 'counter' | 'gauge';
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetric[] = [];
    private timers: Map<string, number> = new Map();

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // Start timing an operation
    startTimer(name: string): void {
        this.timers.set(name, performance.now());
    }

    // End timing and record the metric
    endTimer(name: string): number {
        const startTime = this.timers.get(name);
        if (!startTime) {
            console.warn(`Timer '${name}' was not started`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(name);

        this.recordMetric({
            name,
            value: duration,
            timestamp: Date.now(),
            type: 'timing'
        });

        return duration;
    }

    // Record a counter metric
    recordCounter(name: string, value: number = 1): void {
        this.recordMetric({
            name,
            value,
            timestamp: Date.now(),
            type: 'counter'
        });
    }

    // Record a gauge metric
    recordGauge(name: string, value: number): void {
        this.recordMetric({
            name,
            value,
            timestamp: Date.now(),
            type: 'gauge'
        });
    }

    private recordMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        // Keep only last 1000 metrics to prevent memory leaks
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }

        // Log slow operations in development
        if (process.env.NODE_ENV === 'development' && metric.type === 'timing' && metric.value > 100) {
            console.warn(`Slow operation detected: ${metric.name} took ${metric.value.toFixed(2)}ms`);
        }
    }

    // Get metrics summary
    getMetrics(name?: string): PerformanceMetric[] {
        if (name) {
            return this.metrics.filter(m => m.name === name);
        }
        return [...this.metrics];
    }

    // Get average timing for a specific metric
    getAverageTiming(name: string): number {
        const timings = this.metrics.filter(m => m.name === name && m.type === 'timing');
        if (timings.length === 0) return 0;

        const sum = timings.reduce((acc, m) => acc + m.value, 0);
        return sum / timings.length;
    }

    // Clear all metrics
    clear(): void {
        this.metrics = [];
        this.timers.clear();
    }

    // Get performance summary
    getSummary(): Record<string, any> {
        const summary: Record<string, any> = {};

        // Group metrics by name
        const grouped = this.metrics.reduce((acc, metric) => {
            if (!acc[metric.name]) {
                acc[metric.name] = [];
            }
            acc[metric.name].push(metric);
            return acc;
        }, {} as Record<string, PerformanceMetric[]>);

        // Calculate statistics for each metric
        Object.entries(grouped).forEach(([name, metrics]) => {
            const timings = metrics.filter(m => m.type === 'timing');
            const counters = metrics.filter(m => m.type === 'counter');
            const gauges = metrics.filter(m => m.type === 'gauge');

            summary[name] = {};

            if (timings.length > 0) {
                const values = timings.map(m => m.value);
                summary[name].timing = {
                    count: timings.length,
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    p95: this.percentile(values, 0.95)
                };
            }

            if (counters.length > 0) {
                summary[name].counter = {
                    total: counters.reduce((acc, m) => acc + m.value, 0),
                    count: counters.length
                };
            }

            if (gauges.length > 0) {
                const values = gauges.map(m => m.value);
                summary[name].gauge = {
                    current: values[values.length - 1],
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values)
                };
            }
        });

        return summary;
    }

    private percentile(values: number[], p: number): number {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index] || 0;
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startTimer = (name: string) => performanceMonitor.startTimer(name);
export const endTimer = (name: string) => performanceMonitor.endTimer(name);
export const recordCounter = (name: string, value?: number) => performanceMonitor.recordCounter(name, value);
export const recordGauge = (name: string, value: number) => performanceMonitor.recordGauge(name, value);

// Higher-order function to measure component render time
export function withPerformanceTracking<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    componentName: string
): React.ComponentType<T> {
    return React.memo((props: T) => {
        React.useEffect(() => {
            startTimer(`${componentName}_render`);
            return () => {
                endTimer(`${componentName}_render`);
            };
        });

        return React.createElement(Component, props);
    });
}

// Hook for measuring async operations
export function useAsyncPerformance(operationName: string) {
    return React.useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
        startTimer(operationName);
        try {
            const result = await operation();
            return result;
        } finally {
            endTimer(operationName);
        }
    }, [operationName]);
}

// Monitor API request performance
export function trackApiRequest(endpoint: string, method: string = 'GET') {
    const metricName = `api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    startTimer(metricName);

    return {
        end: () => endTimer(metricName),
        recordError: () => recordCounter(`${metricName}_error`)
    };
}

// Memory usage monitoring
export function getMemoryUsage(): Record<string, number> {
    if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
    }
    return {};
}

// Log performance summary to console (development only)
export function logPerformanceSummary(): void {
    if (process.env.NODE_ENV === 'development') {
        console.group('🚀 Performance Summary');
        console.table(performanceMonitor.getSummary());

        const memoryUsage = getMemoryUsage();
        if (Object.keys(memoryUsage).length > 0) {
            console.log('💾 Memory Usage:', memoryUsage);
        }

        console.groupEnd();
    }
}

// Auto-log performance summary every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
    setInterval(logPerformanceSummary, 30000);
}