import Layout from "@/components/Layout";
import { useAppState } from "@/state/app-state";
import { useMemo, useState, useEffect, memo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { getWorkoutHistory, getTodayWorkoutStats } from "@/lib/api-utils";
import { useTranslationWithState } from "@/lib/i18n";

const buildSeries = (history: { date: string; calories: number }[], days: number) => {
  const map = new Map(history.map((h) => [h.date, h.calories]));
  const res: { date: string; calories: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    res.push({ date: key.slice(5), calories: Math.round((map.get(key) ?? 0) * 10) / 10 });
  }
  return res;
};

const StatsPage = memo(function StatsPage() {
  const { state } = useAppState();
  const { t } = useTranslationWithState(state.language);
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [primaryColor, setPrimaryColor] = useState("#10b981"); // Default fallback
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load workout data from MongoDB
  useEffect(() => {
    const loadWorkoutData = async () => {
      if (!state.user?.id) return;

      setLoading(true);
      try {
        // Load workout history
        const historyResponse = await getWorkoutHistory();
        if (historyResponse.success) {
          setWorkoutHistory(historyResponse.data.history || []);
        }

        // Load today's stats
        const todayResponse = await getTodayWorkoutStats();
        if (todayResponse.success) {
          setTodayStats(todayResponse.data.todayStats);
        }
      } catch (error) {
        console.error('Failed to load workout data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutData();
  }, [state.user?.id]);

  // Get yesterday's stats from MongoDB data
  const yesterday = useMemo(() => {
    const now = new Date();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);

    // Find yesterday's workouts from MongoDB history
    const yesterdayWorkouts = workoutHistory.filter(workout =>
      new Date(workout.date).toDateString() === yesterdayDate.toDateString()
    );

    const totalCalories = yesterdayWorkouts.reduce((sum, workout) => sum + workout.totalCalories, 0);
    const totalExercises = yesterdayWorkouts.reduce((sum, workout) =>
      sum + workout.exercises.reduce((exSum: number, ex: any) => exSum + ex.completedReps, 0), 0
    );

    return {
      date: yesterdayKey,
      calories: totalCalories,
      exercisesCompleted: totalExercises
    };
  }, [workoutHistory]);

  // Get current primary color from CSS variables
  useEffect(() => {
    const updatePrimaryColor = () => {
      try {
        const rgbValue = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary-rgb')
          .trim();

        if (rgbValue) {
          // Convert RGB to hex
          const [r, g, b] = rgbValue.split(',').map(v => parseInt(v.trim()));
          const toHex = (n: number) => n.toString(16).padStart(2, '0');
          const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
          setPrimaryColor(hexColor);
        }
      } catch (e) {
        console.warn('Failed to get primary color:', e);
      }
    };

    updatePrimaryColor();

    // Update color when theme changes
    const observer = new MutationObserver(updatePrimaryColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, [state.theme.skin]);

  const rangeLabels = useMemo(() => ({
    daily: t.stats.daily,
    weekly: t.stats.weekly,
    monthly: t.stats.monthly,
    yearly: t.stats.yearly
  }), [t]);

  const handleRangeChange = useCallback((newRange: "daily" | "weekly" | "monthly" | "yearly") => {
    setRange(newRange);
  }, []);

  // Build chart data from MongoDB workout history
  const data = useMemo(() => {
    // Convert MongoDB workout history to daily calories
    const dailyCalories = new Map<string, number>();

    workoutHistory.forEach(workout => {
      const date = new Date(workout.date).toISOString().slice(0, 10);
      const currentCalories = dailyCalories.get(date) || 0;
      dailyCalories.set(date, currentCalories + workout.totalCalories);
    });

    // Convert to array format for chart
    const historyArray = Array.from(dailyCalories.entries()).map(([date, calories]) => ({
      date,
      calories,
      exercisesCompleted: 0 // We'll calculate this if needed
    }));

    if (range === "daily") return buildSeries(historyArray, 7);
    if (range === "weekly") return buildSeries(historyArray, 28);
    if (range === "monthly") return buildSeries(historyArray, 120);
    return buildSeries(historyArray, 365);
  }, [workoutHistory, range]);

  const plan = useMemo(() =>
    state.workoutPlans.find((p) => p.id === state.workoutPlanId)!,
    [state.workoutPlans, state.workoutPlanId]
  );

  // Calculate calories per exercise from today's workouts
  const perExercise = useMemo(() => {
    if (!todayStats || !workoutHistory.length) {
      // Fallback to current plan data
      return plan.exercises.map((e) => ({
        name: e.name,
        kcal: Math.round(e.completedReps * e.caloriesPerRep)
      }));
    }

    // Get today's workouts from MongoDB
    const today = new Date().toDateString();
    const todayWorkouts = workoutHistory.filter(workout =>
      new Date(workout.date).toDateString() === today
    );

    // Aggregate calories by exercise name
    const exerciseCalories = new Map<string, number>();
    todayWorkouts.forEach(workout => {
      workout.exercises.forEach((ex: any) => {
        const current = exerciseCalories.get(ex.name) || 0;
        exerciseCalories.set(ex.name, current + (ex.caloriesBurned || 0));
      });
    });

    return Array.from(exerciseCalories.entries()).map(([name, kcal]) => ({
      name,
      kcal: Math.round(kcal)
    }));
  }, [todayStats, workoutHistory, plan.exercises]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t.stats.title}</h2>
        <div className="flex items-center gap-2 text-xs">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={"rounded-md px-3 py-1 border " + (range === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Today's and Yesterday's Results */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Results */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-lg font-semibold mb-3">{t.stats.todaysResults}</h3>
          {loading ? (
            <div className="text-center text-foreground/50">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {todayStats?.totalCalories?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-foreground/70">{t.stats.caloriesBurned}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {todayStats?.totalExercises || 0}
                </div>
                <div className="text-sm text-foreground/70">{t.stats.exercisesCompleted}</div>
              </div>
            </div>
          )}
          {!loading && (!todayStats || (todayStats.totalCalories === 0 && todayStats.totalExercises === 0)) && (
            <div className="text-center text-foreground/50 text-sm mt-2">
              {t.stats.noWorkoutDataToday}
            </div>
          )}
        </div>

        {/* Yesterday's Results */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-lg font-semibold mb-3">{t.stats.yesterdaysResults}</h3>
          {loading ? (
            <div className="text-center text-foreground/50">{t.common.loading}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {yesterday.calories.toFixed(1)}
                </div>
                <div className="text-sm text-foreground/70">{t.stats.caloriesBurned}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {yesterday.exercisesCompleted}
                </div>
                <div className="text-sm text-foreground/70">{t.stats.exercisesCompleted}</div>
              </div>
            </div>
          )}
          {!loading && yesterday.calories === 0 && yesterday.exercisesCompleted === 0 && (
            <div className="text-center text-foreground/50 text-sm mt-2">
              {t.stats.noWorkoutDataYesterday}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 relative z-0">
          <div className="text-sm text-foreground/70 mb-2">{t.common.calories} ({rangeLabels[range]})</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#aaa" tick={{ fontSize: 12 }} />
                <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="calories" stroke={primaryColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 relative z-0 calories-per-exercise-card">
          <div className="text-sm text-foreground/70 mb-2">{t.stats.caloriesPerExercise}</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perExercise} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#aaa" tick={false} axisLine={false} />
                <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  formatter={(value, name, props) => [
                    `${value} kcal`,
                    props.payload.name
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="kcal" fill={primaryColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default StatsPage;
