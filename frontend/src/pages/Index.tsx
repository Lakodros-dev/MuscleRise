import Layout from "@/components/Layout";
import Avatar from "@/components/Avatar";
import { useAppState } from "@/state/app-state";
import { Link } from "react-router-dom";
import { memo, useMemo, useCallback, useState, useEffect } from "react";
import { useTranslationWithState, translateExerciseName, translatePlanName } from "@/lib/i18n";

const Index = memo(function Index() {
  const { state, dispatch } = useAppState();
  const { t } = useTranslationWithState(state.language);

  const plan = useMemo(() =>
    state.workoutPlans.find((p) => p.id === state.workoutPlanId) || state.workoutPlans[0],
    [state.workoutPlans, state.workoutPlanId]
  );

  // Force refresh user data on Index page mount to ensure completed states are correct
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const { getCurrentUser, authManager } = await import("@/lib/api-utils");

        // Check if user is authenticated
        if (!authManager.isAuthenticated()) {
          console.log('❌ User not authenticated, skipping refresh');
          return;
        }

        console.log('🔄 Force refreshing user data on Index page mount');

        const userResponse = await getCurrentUser();
        if (userResponse.success && userResponse.data?.user) {
          dispatch({
            type: "HYDRATE",
            payload: {
              user: userResponse.data.user
            }
          });
          console.log('✅ User data force refreshed on Index page');
        } else {
          console.log('❌ Failed to get user data:', userResponse.error);
        }
      } catch (error) {
        console.error('Failed to force refresh user data:', error);
      }
    };

    refreshUserData();
  }, []); // Run once on mount

  // Clean up old localStorage entries for completed exercises
  useEffect(() => {
    const today = new Date().toDateString();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('completed_') || key.startsWith('reps_')) && !key.includes(today)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log('🧹 Cleaned up old localStorage entries:', keysToRemove.length);
    }
  }, []); // Run once on mount

  // Load workout data when component mounts or user changes
  useEffect(() => {
    const loadWorkoutData = async () => {
      if (!state.user?.id) return;

      try {
        const { getWorkoutHistory, getTodayWorkoutStats, getCurrentUser } = await import("@/lib/api-utils");

        const [historyResponse, todayResponse, userResponse] = await Promise.all([
          getWorkoutHistory(),
          getTodayWorkoutStats(),
          getCurrentUser() // Always get fresh user data to ensure completed states are correct
        ]);

        // Update today's stats
        if (historyResponse.success || todayResponse.success) {
          dispatch({
            type: "LOAD_WORKOUT_DATA",
            payload: {
              workoutHistory: historyResponse.data?.history || [],
              todayStats: todayResponse.data?.todayStats || null
            }
          });
          if (import.meta.env.DEV) {
            console.log('🔄 Workout data refreshed on Index page');
          }
        }

        // Update user data including userPlans with completed states
        if (userResponse.success && userResponse.data?.user) {
          dispatch({
            type: "HYDRATE",
            payload: {
              user: userResponse.data.user
            }
          });
          if (import.meta.env.DEV) {
            console.log('🔄 User data with workout plans refreshed on Index page');
          }
        }
      } catch (error) {
        console.error('Failed to load workout data on Index:', error);
      }
    };

    // Only load if user exists and we haven't loaded recently
    const timeoutId = setTimeout(loadWorkoutData, 500); // Small delay to avoid conflicts

    return () => clearTimeout(timeoutId);
  }, [state.user?.id, dispatch]);

  const completeSome = useCallback((exId: string, reps: number) => {
    // Dispatch the action
    dispatch({ type: "COMPLETE_EXERCISE", payload: { planId: plan.id, exerciseId: exId, reps } });

    // Also save to localStorage as backup
    const today = new Date().toDateString();
    const completedKey = `completed_${plan.id}_${exId}_${today}`;
    const repsKey = `reps_${plan.id}_${exId}_${today}`;

    // Get current reps from localStorage or exercise state
    const currentReps = parseInt(localStorage.getItem(repsKey) || '0');
    const exercise = plan.exercises.find(e => e.id === exId);
    const actualCurrentReps = Math.max(currentReps, exercise?.completedReps || 0);
    const newReps = actualCurrentReps + reps;

    localStorage.setItem(completedKey, 'true');
    localStorage.setItem(repsKey, newReps.toString());
    console.log('💾 Saved exercise to localStorage:', { completedKey, repsKey, newReps });
  }, [dispatch, plan.id, plan.exercises]);

  return (
    <Layout>
      <section className="mb-6">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-0">
          <div className="flex items-center gap-3">
            <span className="rounded-md px-2 py-1 text-xs bg-muted border border-border text-primary-text">{t.home.todaysRank}</span>
            <div className="text-lg font-semibold text-primary-text">You #{state.rank.position} / {state.rank.total}</div>
          </div>
          <div className="text-sm text-primary-text/80">{t.home.improveRank}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="order-2 md:order-1">
          <div className="rounded-xl border border-border bg-card p-4 relative z-0">
            <h3 className="font-semibold mb-2">{t.home.todaysWorkouts}</h3>
            <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              <ul className="space-y-3">
                {(plan.exercises || []).map((e) => {
                  // Check localStorage for completed reps and state
                  const today = new Date().toDateString();
                  const completedKey = `completed_${plan.id}_${e.id}_${today}`;
                  const repsKey = `reps_${plan.id}_${e.id}_${today}`;

                  const isCompletedFromStorage = localStorage.getItem(completedKey) === 'true';
                  const completedRepsFromStorage = parseInt(localStorage.getItem(repsKey) || '0');

                  // Use localStorage data if available, otherwise use state data
                  const actualCompletedReps = Math.max(e.completedReps, completedRepsFromStorage);
                  const remaining = Math.max(0, e.targetReps - actualCompletedReps);
                  const isCompleted = e.completed || remaining <= 0 || isCompletedFromStorage;

                  // Debug log for development
                  if (import.meta.env.DEV && (actualCompletedReps > 0 || isCompletedFromStorage)) {
                    console.log(`🔍 Exercise ${e.name}: completed=${e.completed}, stateReps=${e.completedReps}, storageReps=${completedRepsFromStorage}, actualReps=${actualCompletedReps}, targetReps=${e.targetReps}, isCompleted=${isCompleted}`);
                  }

                  return (
                    <li key={e.id} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-primary-text">{translateExerciseName(e.name, t)}</div>
                        <div className="text-xs text-primary-text/60">{actualCompletedReps}/{e.targetReps} • {e.caloriesPerRep} {t.common.caloriesPerRep}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isCompleted}
                          onClick={() => completeSome(e.id, Math.min(5, remaining))}
                          className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                        >+5</button>
                        <button
                          disabled={isCompleted}
                          onClick={() => completeSome(e.id, remaining)}
                          className="rounded-md px-3 py-1 text-sm font-semibold bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ color: `rgb(var(--primary-rgb))` }}
                        >{t.common.complete}</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="rounded-2xl border border-border bg-card p-4 text-center relative z-0">
            <div className="flex justify-center">
              {state.user?.avatarUrl ? (
                <img
                  src={state.user.avatarUrl}
                  alt="User Avatar"
                  className="w-32 h-32 rounded-full object-cover border-2 border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/128x128/e5e7eb/9ca3af?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-muted p-3 w-max mx-auto">
                <div className="text-xs opacity-70">{t.common.coins}</div>
                <div className="text-lg font-semibold" style={{ color: "rgb(var(--primary-rgb))" }}>{state.coins}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-3">
          <div className="rounded-xl border border-border bg-card p-4 relative z-0">
            <h3 className="font-semibold mb-2 text-primary-text">{t.home.todaysStats}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label={t.common.workouts} value={state.today.exercisesCompleted} />
              <Stat label={t.common.calories} value={`${Math.round(state.today.calories)} kcal`} />
              <Stat label={t.common.rank} value={`#${state.rank.position}`} />
              <Stat label={t.common.plan} value={plan ? translatePlanName(plan.name, t) : "Unknown Plan"} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-xl border border-border bg-card p-4 relative z-0">
          <h3 className="font-semibold mb-2">{t.home.mainMenu}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MenuCard title={t.home.menuItems.workouts.title} to="#workouts" desc={t.home.menuItems.workouts.desc} />
            <MenuCard title={t.home.menuItems.stats.title} to="/stats" desc={t.home.menuItems.stats.desc} />
            <MenuCard title={t.home.menuItems.settings.title} to="/settings" desc={t.home.menuItems.settings.desc} />
            <MenuCard title={t.home.menuItems.topUsers.title} to="/top" desc={t.home.menuItems.topUsers.desc} />
          </div>
        </div>
      </section>


    </Layout>
  );
});

export default Index;

const Stat = memo(function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <div className="text-xs text-primary-text/70">{label}</div>
      <div className="text-lg font-semibold text-primary-text">{value}</div>
    </div>
  );
});

const MenuCard = memo(function MenuCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="group rounded-lg border border-border bg-card p-4 hover:bg-muted transition">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-primary-text">{title}</h4>
        <span className="text-xs opacity-0 group-hover:opacity-100 transition text-primary-text">Details →</span>
      </div>
      <p className="mt-1 text-sm text-primary-text/70">{desc}</p>
    </Link>
  );
});
