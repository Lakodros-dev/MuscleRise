import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
    server: {
        host: "::",
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    build: {
        outDir: "dist",
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Core React libraries
                    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                        return 'vendor';
                    }

                    // Charts - separate chunk for lazy loading
                    if (id.includes('recharts')) {
                        return 'charts';
                    }

                    // Radix UI components
                    if (id.includes('@radix-ui')) {
                        return 'ui';
                    }

                    // Animation and motion
                    if (id.includes('framer-motion')) {
                        return 'motion';
                    }

                    // Query and state management
                    if (id.includes('@tanstack/react-query')) {
                        return 'query';
                    }

                    // Utility libraries
                    if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
                        return 'utils';
                    }

                    // Lucide icons
                    if (id.includes('lucide-react')) {
                        return 'icons';
                    }

                    // Node modules (other vendor libraries)
                    if (id.includes('node_modules')) {
                        return 'vendor-misc';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'terser' as const,
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                passes: 2,
                dead_code: true,
                collapse_vars: true,
                reduce_vars: true,
                unused: true,
                pure_getters: true
            },
            mangle: {
                safari10: true
            },
            format: {
                comments: false
            }
        },
        target: 'es2020',
        cssCodeSplit: true,
        reportCompressedSize: false, // Faster builds
        sourcemap: false // Smaller builds
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            '@tanstack/react-query',
            'clsx',
            'tailwind-merge',
            'lucide-react',
            'recharts'
        ],
        esbuildOptions: {
            target: 'es2020'
        }
    }
}));