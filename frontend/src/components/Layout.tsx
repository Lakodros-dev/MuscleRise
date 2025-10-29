import MRNavbar from "@/components/MRNavbar";
import { useEffect, useState, useMemo, useRef, useCallback, memo } from "react";
import { useAppState } from "@/state/app-state";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, RotateCcw, AlertTriangle, Users, Eye, Lock, Key } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import Onboarding from "@/components/Onboarding";
import { useTranslationWithState } from "@/lib/i18n";

// Page order for navigation direction detection
const PAGE_ORDER: Record<string, number> = {
  '/': 0,
  '/shop': 1,
  '/stats': 2,
  '/top': 3,
  '/settings': 4,
};

const Layout = memo(function Layout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useAppState();

  // Defensive check for state
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center p-4 bg-red-900 rounded-lg max-w-md">
          <h2 className="text-lg font-bold mb-2">Application Error</h2>
          <p>Unable to load application state. Please refresh the page.</p>
        </div>
      </div>
    );
  }
  const [showAdmin, setShowAdmin] = useState(false);
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  const [primaryColorInitialized, setPrimaryColorInitialized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [globalMuscleBoostEnabled, setGlobalMuscleBoostEnabled] = useState(false);

  // Determine slide direction based on page navigation
  const getSlideDirection = () => {
    const currentOrder = PAGE_ORDER[location.pathname] ?? 0;
    const prevOrder = PAGE_ORDER[prevLocationRef.current] ?? 0;
    const isForward = currentOrder > prevOrder;

    prevLocationRef.current = location.pathname;
    return isForward;
  };

  const isForward = getSlideDirection();

  useEffect(() => {
    // Ensure dark class
    document.documentElement.classList.add("dark");

    // Initialize primary color only once
    if (!primaryColorInitialized) {
      const currentRgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-rgb').trim();
      if (!currentRgb || currentRgb === '16, 185, 129') {
        // Set default emerald if no custom color is set
        document.documentElement.style.setProperty('--primary-rgb', '16, 185, 129');
      }
      setPrimaryColorInitialized(true);
    }
  }, [primaryColorInitialized]);

  // Apply theme choices to CSS variables with memoization
  const themeConfig = useMemo(() => {
    const skin = state.theme.skin;
    // default values - NEVER override primary color if user has custom color
    const mapping: Record<string, { background?: string; bodyBg?: string; foreground?: string }> = {
      default: { background: "0 0% 4%", foreground: "210 40% 98%" },
      "design-dark": { background: "0 0% 3%", foreground: "210 40% 98%" },
      "design-emerald": { background: "160 20% 6%", foreground: "210 40% 98%", bodyBg: "linear-gradient(180deg,#0a2f28 0%, #030a08 100%)" },
      "design-sky": { background: "210 16% 8%", foreground: "210 40% 98%" },
      "design-white": { background: "0 0% 98%", foreground: "222.2 84% 4.9%", bodyBg: "linear-gradient(180deg, #f5f5f5, #ffffff)" },
      "bg-gradient": { background: "210 16% 8%", foreground: "210 40% 98%", bodyBg: "linear-gradient(180deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04), #030303)" },
      "bg-forest": { background: "160 20% 12%", foreground: "210 40% 98%", bodyBg: "linear-gradient(180deg,#0b3d2e 0%, #07151b 100%)" },
      "primary-emerald": { foreground: "210 40% 98%" },
      "primary-sky": { foreground: "210 40% 98%" },
      "primary-pink": { foreground: "210 40% 98%" },
      "primary-yellow": { foreground: "210 40% 98%" },
      "primary-white": { foreground: "210 40% 98%" },
    };

    let finalSelected = mapping[skin];

    // Use default if skin not found in mapping
    finalSelected = finalSelected ?? mapping.default;

    return {
      background: finalSelected.background,
      foreground: finalSelected.foreground,
      bodyBg: finalSelected.bodyBg,
    };
  }, [state.theme.skin]);

  useEffect(() => {
    // NEVER override primary color from themes - let user custom colors persist
    if (themeConfig.background) document.documentElement.style.setProperty("--background", themeConfig.background);
    if (themeConfig.foreground) document.documentElement.style.setProperty("--foreground", themeConfig.foreground);

    // Get current primary color and derive text colors from it
    const updateTextColorsFromPrimary = () => {
      try {
        const rgbValue = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary-rgb')
          .trim();

        if (rgbValue) {
          const [r, g, b] = rgbValue.split(',').map(v => parseInt(v.trim()));

          // Calculate luminance to determine if primary color is light or dark
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          // Create variations of the primary color for text
          const primaryHue = rgbToHsl(r, g, b).h;

          // Use primary color for various text elements
          const primaryTextColor = `${r}, ${g}, ${b}`;
          const lightPrimaryText = `${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)}`;
          const darkPrimaryText = `${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}`;

          // Apply primary-influenced colors to text elements
          document.documentElement.style.setProperty('--text-primary', primaryTextColor);
          document.documentElement.style.setProperty('--text-primary-light', lightPrimaryText);
          document.documentElement.style.setProperty('--text-primary-dark', darkPrimaryText);

          // Update muted and secondary text colors with primary influence
          if (state.theme.skin !== "design-white") {
            const mutedWithPrimary = `hsl(${primaryHue}, 15%, 65%)`;
            const cardForegroundWithPrimary = `hsl(${primaryHue}, 20%, 85%)`;
            document.documentElement.style.setProperty('--muted-foreground', mutedWithPrimary);
            document.documentElement.style.setProperty('--card-foreground', cardForegroundWithPrimary);
          }
        }
      } catch (e) {
        console.warn('Failed to update text colors from primary:', e);
      }
    };

    // Helper function to convert RGB to HSL
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };

    // Update text colors based on primary color
    updateTextColorsFromPrimary();

    // Watch for primary color changes
    const observer = new MutationObserver(() => {
      updateTextColorsFromPrimary();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    // White theme uchun border ranglarini ko'rinadigan qilish
    if (state.theme.skin === "design-white") {
      document.documentElement.style.setProperty("--border", "214.3 20% 70%");
      document.documentElement.style.setProperty("--input", "214.3 20% 70%");
      document.documentElement.style.setProperty("--card", "0 0% 92%");
      document.documentElement.style.setProperty("--muted", "210 15% 88%");
    } else {
      document.documentElement.style.setProperty("--border", "220 8% 18%");
      document.documentElement.style.setProperty("--input", "220 8% 18%");
      document.documentElement.style.setProperty("--card", "0 0% 6%");
      document.documentElement.style.setProperty("--muted", "220 9% 12%");
    }

    if (themeConfig.bodyBg) {
      document.body.style.backgroundImage = themeConfig.bodyBg;
    } else {
      document.body.style.backgroundImage = "";
    }

    return () => observer.disconnect();
  }, [themeConfig, state.theme.skin]);

  const openAdmin = useCallback(() => {
    setShowPasswordModal(true);
    setAdminPassword("");
    setAdminPasswordError("");
  }, []);

  const handlePasswordSubmit = async () => {
    if (!adminPassword.trim()) {
      setAdminPasswordError("Password is required");
      return;
    }

    try {
      const { makeApiRequest } = await import("@/lib/api-utils");

      const response = await makeApiRequest('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: adminPassword })
      });

      if (response.success) {
        setIsAdminAuthenticated(true);
        setShowPasswordModal(false);
        setShowAdmin(true);
        setAdminPasswordError("");
        // Set the global muscle boost state from the response
        setGlobalMuscleBoostEnabled(response.data.globalMuscleBoostEnabled ?? false);

        // Fetch users after successful authentication
        setUsersLoading(true);
        try {
          const usersResponse = await makeApiRequest('/auth/users');
          if (usersResponse.success) {
            setAdminUsers(usersResponse.data.users || []);
          } else {
            console.warn('Failed to fetch users for admin panel:', usersResponse.error);
            setAdminUsers([]);
          }
        } catch (e) {
          console.warn('Error fetching users:', e);
          setAdminUsers([]);
        } finally {
          setUsersLoading(false);
        }
      } else {
        setAdminPasswordError(response.error || "Invalid password");
      }
    } catch (e) {
      setAdminPasswordError("Failed to authenticate. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      setChangePasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError("New passwords do not match");
      return;
    }

    try {
      const { makeApiRequest } = await import("@/lib/api-utils");

      const response = await makeApiRequest('/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      if (response.success) {
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangePasswordError("");
        alert("Password changed successfully!");
      } else {
        setChangePasswordError(response.error || "Failed to change password");
      }
    } catch (e) {
      setChangePasswordError("Failed to change password. Please try again.");
    }
  };
  const closeAdmin = useCallback(() => {
    setShowAdmin(false);
    setShowPasswordModal(false);
    setShowChangePassword(false);
    setSelectedUser(null);
    setAdminUsers([]);
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    setAdminPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordError("");
  }, []);

  // Custom event for broadcasting global muscle boost changes
  const broadcastGlobalMuscleBoostChange = useCallback((enabled: boolean) => {
    // Create a custom event
    const event = new CustomEvent('globalMuscleBoostChange', { detail: { enabled } });
    // Dispatch the event
    window.dispatchEvent(event);
  }, []);

  // Dynamic background based on theme skin
  const getThemeBackground = useCallback(() => {
    switch (state.theme.skin) {
      case "design-dark":
        return "linear-gradient(180deg, rgba(107, 114, 128, 0.08), rgba(107, 114, 128, 0.02), #020202)"; // very dark gray
      case "design-emerald":
        return "linear-gradient(180deg,#0a2f28 0%, #030a08 100%)"; // emerald gradient
      case "design-sky":
        return "linear-gradient(180deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04), #030303)"; // blue
      case "design-white":
        return "linear-gradient(180deg, rgba(156, 163, 175, 0.12), rgba(156, 163, 175, 0.04), #030303)"; // light gray
      case "bg-gradient":
        return "linear-gradient(180deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04), #030303)"; // sky gradient
      case "bg-forest":
        return "linear-gradient(180deg,#0b3d2e 0%, #07151b 100%)"; // forest gradient
      case "primary-emerald":
      case "primary-sky":
      case "primary-pink":
      case "primary-yellow":
      case "primary-white":
      case "default":
        // For primary color themes, use subtle neutral gradient
        return "linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01), #030303)";
      default:
        return "linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01), #030303)";
    }
  }, [state.theme.skin]);

  const backgroundStyle = useMemo(() => ({
    background: getThemeBackground()
  }), [getThemeBackground]);

  return (
    <div className="min-h-screen text-foreground relative" style={backgroundStyle} data-theme={state.theme.skin}>
      {/* Enhanced transition overlay effect */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-r from-black/5 via-primary/5 to-black/5 z-[1] pointer-events-none"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{
          opacity: isTransitioning ? 1 : 0,
          scale: isTransitioning ? 1 : 1.1
        }}
        transition={{
          duration: 0.4,
          ease: "easeInOut"
        }}
      />
      <MRNavbar />

      <main className="container py-6 overflow-hidden relative z-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{
              x: isForward ? "100%" : "-100%",
              opacity: 0,
              scale: 0.92,
              filter: "blur(8px)",
              rotateY: isForward ? 15 : -15
            }}
            animate={{
              x: 0,
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              rotateY: 0
            }}
            exit={{
              x: isForward ? "-100%" : "100%",
              opacity: 0,
              scale: 0.92,
              filter: "blur(8px)",
              rotateY: isForward ? -15 : 15
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 25,
              mass: 0.7,
              duration: 0.7,
              opacity: { duration: 0.4, ease: "easeInOut" },
              scale: { duration: 0.5, ease: "easeOut" },
              filter: { duration: 0.4, ease: "easeInOut" },
              rotateY: { duration: 0.6, ease: "easeInOut" }
            }}
            onAnimationStart={() => setIsTransitioning(true)}
            onAnimationComplete={() => setIsTransitioning(false)}
            className="w-full relative z-[2]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-20 border-t border-white/10 py-6 text-center text-xs text-foreground/60">
        <span
          onClick={(e) => { e.stopPropagation(); openAdmin(); }}
          role="button"
          aria-label="Open admin panel"
          title="Open admin panel"
          className="mr-1 inline-block cursor-pointer"
        >
          ©
        </span>
        {new Date().getFullYear()} MuscleRise
      </footer>

      {showAdmin ? (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/90 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-neutral-900 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Admin Panel</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-1 rounded-md px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700"
                >
                  <Key className="w-3 h-3" />
                  Change Password
                </button>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch({ type: "TOGGLE_WHITE_THEME", payload: { enabled: !state.theme.whiteThemeEnabled } })}
                      className={`rounded-md px-3 py-1 text-sm ${state.theme.whiteThemeEnabled
                        ? 'bg-green-600 hover:bg-green-500'
                        : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                    >
                      White Theme (Global): {state.theme.whiteThemeEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={async () => {
                        // Toggle white theme for only this user
                        if (state.user?.id) {
                          try {
                            const newEnabledState = !state.theme.whiteThemeEnabled;
                            const { updateUser } = await import("@/lib/api-utils");
                            await updateUser(state.user.id, {
                              themeWhiteThemeEnabled: newEnabledState
                            });
                            dispatch({ type: "TOGGLE_WHITE_THEME", payload: { enabled: newEnabledState } });
                          } catch (e) {
                            console.warn('Failed to toggle white theme for user:', e);
                          }
                        }
                      }}
                      className="rounded-md px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 flex items-center gap-1"
                      title="Turn on for only this user"
                    >
                      Only for this user
                      {state.theme.whiteThemeEnabled && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        // Toggle muscle boost globally
                        try {
                          const newEnabledState = !globalMuscleBoostEnabled;
                          const { makeApiRequest } = await import("@/lib/api-utils");

                          const response = await makeApiRequest('/admin/global-settings', {
                            method: "POST",
                            body: JSON.stringify({
                              globalMuscleBoostEnabled: newEnabledState
                            }),
                          });

                          if (response.success) {
                            setGlobalMuscleBoostEnabled(response.data.globalMuscleBoostEnabled);
                            // Broadcast the change to other components
                            broadcastGlobalMuscleBoostChange(response.data.globalMuscleBoostEnabled);
                            // Show a confirmation message
                            alert(`Muscle Boost globally ${response.data.globalMuscleBoostEnabled ? 'enabled' : 'disabled'} successfully!`);
                          } else {
                            console.error('Failed to toggle global muscle boost:', response.error);
                          }
                        } catch (e) {
                          console.warn('Failed to toggle global muscle boost:', e);
                        }
                      }}
                      className={`rounded-md px-3 py-1 text-sm ${globalMuscleBoostEnabled
                        ? 'bg-green-600 hover:bg-green-500'
                        : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                    >
                      Muscle Boost (Global): {globalMuscleBoostEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={async () => {
                        // Toggle muscle boost for only this user
                        if (state.user?.id) {
                          try {
                            const newEnabledState = !state.theme.muscleBoostEnabled;
                            const { updateUser } = await import("@/lib/api-utils");
                            await updateUser(state.user.id, {
                              themeMuscleBoostEnabled: newEnabledState
                            });
                            dispatch({ type: "TOGGLE_MUSCLE_BOOST", payload: { enabled: newEnabledState } });
                          } catch (e) {
                            console.warn('Failed to toggle muscle boost for user:', e);
                          }
                        }
                      }}
                      className="rounded-md px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 flex items-center gap-1"
                      title="Turn on for only this user"
                    >
                      Only for this user
                      {state.theme.muscleBoostEnabled && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button onClick={() => { dispatch({ type: "ADD_COINS", payload: { amount: 100 } }); }} className="rounded-md bg-emerald-600 px-3 py-1">+100 coins</button>
                <button onClick={() => {
                  localStorage.removeItem("mr_app_state_v1");
                  localStorage.removeItem("mr_admin_date_override");
                  window.location.reload();
                }} className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 hover:bg-red-500">
                  <RotateCcw className="w-3 h-3" />
                  Reset & Reload
                </button>
                <button onClick={closeAdmin} className="rounded-md bg-white/10 px-3 py-1">Close</button>
              </div>
            </div>

            {/* Users Management Section */}
            <div className="mb-4 p-4 bg-black/40 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                <h4 className="text-md font-semibold">User Management & Statistics</h4>
              </div>

              {usersLoading ? (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <div className="relative mr-3">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <span className="text-sm text-foreground/70">
                      Loading users
                      <span className="inline-flex space-x-1 ml-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Users List */}
                  <div>
                    <h5 className="text-sm font-medium mb-2 text-foreground/80">All Users ({adminUsers.length})</h5>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {adminUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 rounded border cursor-pointer transition-colors ${selectedUser?.id === user.id
                            ? 'bg-blue-600/20 border-blue-500'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{user.name || user.username}</div>
                              <div className="text-xs text-foreground/60">@{user.username}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-400">{user.coins || 0} coins</div>
                              <div className="text-xs text-foreground/60">{user.todayExercises || 0} exercises</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected User Details */}
                  <div>
                    <h5 className="text-sm font-medium mb-2 text-foreground/80">User Details</h5>
                    {selectedUser ? (
                      <div className="bg-white/5 rounded border border-white/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">{selectedUser.name || selectedUser.username}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-black/20 rounded p-2">
                            <div className="text-xs text-foreground/60">Total Coins</div>
                            <div className="font-bold text-emerald-400">{selectedUser.coins || 0}</div>
                          </div>
                          <div className="bg-black/20 rounded p-2">
                            <div className="text-xs text-foreground/60">Today's Exercises</div>
                            <div className="font-bold text-blue-400">{selectedUser.todayExercises || 0}</div>
                          </div>
                          <div className="bg-black/20 rounded p-2">
                            <div className="text-xs text-foreground/60">Today's Calories</div>
                            <div className="font-bold text-orange-400">{Math.round(selectedUser.todayCalories || 0)} kcal</div>
                          </div>
                          <div className="bg-black/20 rounded p-2">
                            <div className="text-xs text-foreground/60">User ID</div>
                            <div className="font-mono text-xs text-foreground/80">{selectedUser.id?.slice(0, 8)}...</div>
                          </div>
                        </div>

                        {selectedUser.avatarUrl && (
                          <div className="mt-3">
                            <div className="text-xs text-foreground/60 mb-1">Avatar</div>
                            <img
                              src={selectedUser.avatarUrl}
                              alt="User avatar"
                              className="w-12 h-12 rounded-full border border-white/20"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-foreground/60">Quick Actions</div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                if (confirm(`Give 100 coins to ${selectedUser.name || selectedUser.username}?`)) {
                                  // This would need API implementation
                                  console.log('Give coins to user:', selectedUser.id);
                                }
                              }}
                              className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded"
                            >
                              +100 Coins
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedUser.id);
                                alert('User ID copied to clipboard!');
                              }}
                              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                            >
                              Copy ID
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/5 rounded border border-white/10 p-4 text-center text-sm text-foreground/60">
                        Select a user to view their statistics
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Controls */}
            <div className="mb-4 p-4 bg-black/40 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Date Control System</h4>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="text-sm text-foreground/70 mb-1">Current App Date:</div>
                  <div className="text-lg font-mono">{state.today.date}</div>
                  {state.adminDateOverride && (
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                      <AlertTriangle className="w-3 h-3" />
                      Date Override Active
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-foreground/70 mb-1">Real Date & Time:</div>
                  <div className="text-lg font-mono">{new Date().toLocaleString()}</div>
                  <div className="text-xs text-foreground/50">UTC: {new Date().toISOString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch({ type: "ADMIN_PREV_DAY" })}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Previous Day
                </button>
                <button
                  onClick={() => dispatch({ type: "ADMIN_NEXT_DAY" })}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  Next Day
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => dispatch({ type: "ADMIN_RESET_DATE" })}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Real Date
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("mr_admin_date_override");
                    window.location.reload();
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reload to Today
                </button>
              </div>
              <div className="text-xs text-foreground/60 mt-2">
                Use date controls to simulate different days and test workout plan rotations.
              </div>
            </div>

            <pre className="max-h-64 overflow-auto text-xs bg-black/40 p-3 rounded">{JSON.stringify(state, null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {/* Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9998] grid place-items-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Admin Authentication</h3>
            </div>
            <p className="text-sm text-foreground/70 mb-4">Enter admin password to access the admin panel</p>

            <div className="space-y-4">
              <div>
                <PasswordInput
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="Admin password"
                  className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                />
                {adminPasswordError && (
                  <div className="text-red-400 text-xs mt-1">{adminPasswordError}</div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[9997] grid place-items-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Change Admin Password</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {changePasswordError && (
                <div className="text-red-400 text-xs">{changePasswordError}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal - shows on all pages if user not logged in */}
      <Onboarding />
    </div>
  );
});

export default Layout;
