import { memo } from 'react';

export const PageLoader = memo(function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-foreground/70">Loading...</p>
      </div>
    </div>
  );
});

export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]} ${className}`} />
  );
});

// Beautiful registration/login loader inspired by https://uiverse.io/nima-mollazadeh/itchy-bulldog-59
export const AuthLoader = memo(function AuthLoader({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative">
          {/* Main spinning circle */}
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>

          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>

          {/* Outer rotating ring */}
          <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-l-primary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
        </div>

        <p className="mt-6 text-sm text-white/80 font-medium">{message}</p>

        {/* Animated dots */}
        <div className="flex justify-center mt-2 space-x-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
});

// Animated dots for loading text
export const AnimatedDots = memo(function AnimatedDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex space-x-1 ${className}`}>
      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
    </span>
  );
});

// Workout history loader with spinning animation
export const WorkoutHistoryLoader = memo(function WorkoutHistoryLoader({ message = "Loading your workout history" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-sm text-foreground/70">
          {message}
          <AnimatedDots />
        </p>
      </div>
    </div>
  );
});

export default PageLoader;