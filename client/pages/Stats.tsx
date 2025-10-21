import Layout from "@/components/Layout";
import { useAppState } from "@/state/app-state";
import { useMemo, useState, useEffect, memo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

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
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [primaryColor, setPrimaryColor] = useState("#10b981"); // Default fallback

  // Get yesterday's stats
  const yesterday = useMemo(() => {
    const now = new Date();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);
    return state.history.find(h => h.date === yesterdayKey) || { date: yesterdayKey, calories: 0, exercisesCompleted: 0 };
  }, [state.history]);

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
    daily: "Daily", 
    weekly: "Weekly", 
    monthly: "Monthly", 
    yearly: "Yearly" 
  }), []);

  const handleRangeChange = useCallback((newRange: "daily" | "weekly" | "monthly" | "yearly") => {
    setRange(newRange);
  }, []);

  const data = useMemo(() => {
    if (range === "daily") return buildSeries(state.history, 7);
    if (range === "weekly") return buildSeries(state.history, 28);
    if (range === "monthly") return buildSeries(state.history, 120);
    return buildSeries(state.history, 365);
  }, [state.history, range]);

  const plan = useMemo(() => 
    state.workoutPlans.find((p) => p.id === state.workoutPlanId)!, 
    [state.workoutPlans, state.workoutPlanId]
  );
  
  const perExercise = useMemo(() => 
    plan.exercises.map((e) => ({ 
      name: e.name, 
      kcal: Math.round(e.completedReps * e.caloriesPerRep) 
    })), 
    [plan.exercises]
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Statistics</h2>
        <div className="flex items-center gap-2 text-xs">
          {( ["daily", "weekly", "monthly", "yearly"] as const ).map((r) => (
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

      {/* Yesterday's Results */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <h3 className="text-lg font-semibold mb-3">Yesterday's Results</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>
              {yesterday.calories.toFixed(1)}
            </div>
            <div className="text-sm text-foreground/70">Calories Burned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>
              {yesterday.exercisesCompleted}
            </div>
            <div className="text-sm text-foreground/70">Exercises Completed</div>
          </div>
        </div>
        {yesterday.calories === 0 && yesterday.exercisesCompleted === 0 && (
          <div className="text-center text-foreground/50 text-sm mt-2">
            No workout data for yesterday
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 relative z-0">
          <div className="text-sm text-foreground/70 mb-2">Calories ({rangeLabels[range]})</div>
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
          <div className="text-sm text-foreground/70 mb-2">Calories per exercise</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perExercise} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#aaa" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
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
