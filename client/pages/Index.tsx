import Layout from "@/components/Layout";
import Onboarding from "@/components/Onboarding";
import Avatar from "@/components/Avatar";
import { useAppState } from "@/state/app-state";
import { Link } from "react-router-dom";
import { memo, useMemo, useCallback } from "react";

const Index = memo(function Index() {
  const { state, dispatch } = useAppState();
  const plan = useMemo(() => 
    state.workoutPlans.find((p) => p.id === state.workoutPlanId) || state.workoutPlans[0], 
    [state.workoutPlans, state.workoutPlanId]
  );

  const completeSome = useCallback((exId: string, reps: number) => {
    dispatch({ type: "COMPLETE_EXERCISE", payload: { planId: plan.id, exerciseId: exId, reps } });
  }, [dispatch, plan.id]);

  return (
    <Layout>
      {!state.user && <Onboarding />}

      <section className="mb-6">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-0">
          <div className="flex items-center gap-3">
            <span className="rounded-md px-2 py-1 text-xs bg-muted border border-border text-primary-text">Today's rank</span>
            <div className="text-lg font-semibold text-primary-text">You #{state.rank.position} / {state.rank.total}</div>
          </div>
          <div className="text-sm text-primary-text/80">Improve your rank by completing workouts</div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="order-2 md:order-1">
          <div className="rounded-xl border border-border bg-card p-4 relative z-0">
            <h3 className="font-semibold mb-2">Today's Workouts</h3>
            <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              <ul className="space-y-3">
                {(plan.exercises || []).map((e) => {
                  const remaining = Math.max(0, e.targetReps - e.completedReps);
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-primary-text">{e.name}</div>
                        <div className="text-xs text-primary-text/60">{e.completedReps}/{e.targetReps} • {e.caloriesPerRep} kcal/rep</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={remaining <= 0}
                          onClick={() => completeSome(e.id, Math.min(5, remaining))}
                          className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/15 disabled:opacity-50"
                        >+5</button>
                        <button
                          disabled={remaining <= 0}
                          onClick={() => completeSome(e.id, remaining)}
                          className="rounded-md px-3 py-1 text-sm font-semibold bg-white/10 hover:bg-white/15 disabled:opacity-50" 
                          style={{ color: `rgb(var(--primary-rgb))` }}
                        >Complete</button>
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
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-muted p-3 w-max mx-auto">
                <div className="text-xs opacity-70">Coins</div>
                <div className="text-lg font-semibold" style={{ color: "rgb(var(--primary-rgb))" }}>{state.coins}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-3">
          <div className="rounded-xl border border-border bg-card p-4 relative z-0">
            <h3 className="font-semibold mb-2 text-primary-text">Today's stats</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Workouts" value={state.today.exercisesCompleted} />
              <Stat label="Calories" value={`${Math.round(state.today.calories)} kcal`} />
              <Stat label="Rank" value={`#${state.rank.position}`} />
              <Stat label="Plan" value={plan?.name || "Unknown Plan"} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-xl border border-border bg-card p-4 relative z-0">
          <h3 className="font-semibold mb-2">Main menu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MenuCard title="Workouts" to="#workouts" desc="Today's workout list" />
            <MenuCard title="Stats" to="/stats" desc="Daily, weekly, monthly, yearly charts" />
            <MenuCard title="Settings" to="/settings" desc="Customize your profile and preferences" />
            <MenuCard title="Top Users" to="/top" desc="See where you stand among others" />
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
