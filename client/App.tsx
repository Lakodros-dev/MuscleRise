import "./global.css";

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, memo } from "react";
import { AppStateProvider } from "@/state/app-state";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/LoadingSpinner";

// Optimized lazy loading with preloading hints
const Index = lazy(() => 
  import("./pages/Index" /* webpackChunkName: "page-index" */)
);
const StatsPage = lazy(() => 
  import("./pages/Stats" /* webpackChunkName: "page-stats" */)
);
const ShopPage = lazy(() => 
  import("./pages/Shop" /* webpackChunkName: "page-shop" */)
);
const TopPage = lazy(() => 
  import("./pages/Top" /* webpackChunkName: "page-top" */)
);
const SettingsPage = lazy(() => 
  import("./pages/Settings" /* webpackChunkName: "page-settings" */)
);
const NotFound = lazy(() => 
  import("./pages/NotFound" /* webpackChunkName: "page-notfound" */)
);

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

// Memoized App component for better performance
const App = memo(function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
          <AppStateProvider>
            <BrowserRouter future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/top" element={<TopPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AppStateProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

createRoot(document.getElementById("root")!).render(<App />);
