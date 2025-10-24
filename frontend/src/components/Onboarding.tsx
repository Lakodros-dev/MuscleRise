import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/state/app-state";
import { PasswordInput } from "@/components/ui/password-input";

export default memo(function Onboarding() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("login");

  const [form, setForm] = useState({
    // registration fields
    username: "",
    password: "",
    weightKg: "",
    heightCm: "",
    avatarUrl: "",
    planId: state.workoutPlanId,
  });

  const [showMakeYourself, setShowMakeYourself] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableExercises = [
    { id: "push-up", name: "Push up", unit: "reps" },
    { id: "sit-up", name: "Sit up", unit: "reps" },
    { id: "squat", name: "Squat", unit: "reps" },
    { id: "running", name: "Running", unit: "km" },
    { id: "jumping-jacks", name: "Jumping Jacks", unit: "reps" },
    { id: "burpees", name: "Burpees", unit: "reps" },
    { id: "lunges", name: "Lunges", unit: "reps" },
    { id: "plank", name: "Plank", unit: "secs" },
    { id: "mountain-climbers", name: "Mountain Climbers", unit: "reps" },
    { id: "pull-ups", name: "Pull ups", unit: "reps" },
    { id: "deadlift", name: "Deadlift", unit: "reps" },
    { id: "bench-press", name: "Bench press", unit: "reps" },
    { id: "bicep-curls", name: "Bicep curls", unit: "reps" },
    { id: "row", name: "Row", unit: "km" },
    { id: "jump-rope", name: "Jump rope", unit: "mins" },
    { id: "high-knees", name: "High knees", unit: "reps" },
    { id: "leg-raises", name: "Leg raises", unit: "reps" },
  ];

  function MakeYourselfComponent({ availableExercises, onClose, onSave }: { availableExercises: any[]; onClose: () => void; onSave: (sel: any[]) => void }) {
    const [choice, setChoice] = useState(availableExercises[0]?.id ?? "");
    const [qty, setQty] = useState<number | string>(availableExercises[0]?.unit === "km" ? 1 : 10);
    const [localSelected, setLocalSelected] = useState<any[]>(selectedExercises.slice());
    const [localError, setLocalError] = useState<string | null>(null);

    const add = () => {
      setLocalError(null);
      if (!choice) { setLocalError("Choose an exercise"); return; }
      if (localSelected.length >= 5) {
        setLocalError("You can select up to 5 exercises only.");
        return;
      }
      const ex = availableExercises.find((a) => a.id === choice);
      if (!ex) return;
      if (localSelected.find((s) => s.id === ex.id)) {
        setLocalError("Exercise already added");
        return;
      }
      const parsedQty = Number(qty) || 0;
      if (parsedQty <= 0) { setLocalError("Quantity must be greater than 0"); return; }
      setLocalSelected([...localSelected, { id: ex.id, name: ex.name, unit: ex.unit, qty: parsedQty }]);
    };

    const remove = (id: string) => setLocalSelected(localSelected.filter((s) => s.id !== id));

    const handleSave = () => {
      setLocalError(null);
      if (localSelected.length === 0) { setLocalError("Add at least one exercise"); return; }
      if (localSelected.length > 5) { setLocalError("Maximum 5 exercises"); return; }
      for (const s of localSelected) {
        if (!s.qty || Number(s.qty) <= 0) { setLocalError("All exercises must have a quantity > 0"); return; }
      }
      onSave(localSelected);
    };

    return (
      <div>
        <div className="grid gap-3">
          <div className="flex gap-2">
            <select value={choice} onChange={(e) => { const val = e.target.value; setChoice(val); const ex = availableExercises.find((a) => a.id === val); setQty(ex?.unit === "km" ? 1 : 10); }} className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 font-semibold">
              {availableExercises.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>)}
            </select>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="w-28 rounded-md bg-black/40 border border-white/10 px-3 py-2" />
            <button type="button" onClick={add} className="rounded-md bg-emerald-500 px-3 py-1 text-sm hover:bg-emerald-400">Add</button>
          </div>

          {localError && <div className="text-xs text-red-400">{localError}</div>}

          <div className="mt-3">
            <div className="text-sm mb-2">Selected exercises</div>
            <div className="space-y-2 max-h-96 overflow-y-auto" style={{ overflowX: 'hidden' }}>
              {localSelected.length === 0 && <div className="text-xs text-foreground/60">No exercises added yet.</div>}
              {localSelected.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-white/10 p-2">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-foreground/70">{s.qty} {s.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} value={s.qty} onChange={(e) => setLocalSelected(localSelected.map((it) => it.id === s.id ? { ...it, qty: Number(e.target.value) } : it))} className="w-20 rounded-md bg-black/40 border border-white/10 px-2 py-1" />
                    <button onClick={() => remove(s.id)} className="text-sm rounded-md bg-white/5 px-2 py-1 hover:bg-white/10">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={handleSave} className="rounded-md bg-emerald-500 px-4 py-2 hover:bg-emerald-400">Save</button>
            <button onClick={onClose} className="rounded-md bg-white/5 px-4 py-2 hover:bg-white/10">Close</button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (state.user) setShowWelcome(false);
  }, [state.user]);

  if (state.user) return null;

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(form.weightKg);
    const height = parseFloat(form.heightCm);
    const newErrors: Record<string, string> = {};
    if (!form.username) newErrors.username = "Username is required";
    if (!form.password) newErrors.password = "Password is required";
    if (Number.isNaN(weight) || weight <= 0) newErrors.weightKg = "Enter a valid weight";
    if (Number.isNaN(height) || height <= 0) newErrors.heightCm = "Enter a valid height";
    if (form.planId === "make-yourself" && selectedExercises.length === 0) newErrors.planId = "Please create a custom plan or choose another plan";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const { registerUser } = await import("@/lib/api-utils");

      const response = await registerUser({
        username: form.username,
        password: form.password,
        weightKg: weight,
        heightCm: height,
        avatarUrl: form.avatarUrl || "",
        planId: form.planId,
        customExercises: selectedExercises,
      });

      if (!response.success) {
        const msg = response.error || "Register failed";
        if (msg.toLowerCase().includes("username")) {
          setErrors({ username: "This username is already taken" });
        } else if (msg.toLowerCase().includes("missing required fields")) {
          setErrors({ general: msg });
        } else {
          setErrors({ general: msg });
        }
        return;
      }

      // merge user into state
      dispatch({ type: "HYDRATE", payload: { user: response.data?.user } });
      dispatch({ type: "SELECT_PLAN", payload: { planId: form.planId } });
      try { localStorage.setItem("mr_app_state_v1", JSON.stringify({ ...state, user: response.data?.user })); } catch (e) { }
      setShowWelcome(true);
      // navigate to home to load app with user
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setErrors({ general: "Unexpected error" });
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.username) newErrors.username = "Username is required";
    if (!form.password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try {
      const { loginUser } = await import("@/lib/api-utils");

      const response = await loginUser(form.username, form.password);

      if (!response.success) {
        const msg = response.error || "Login failed";
        if (msg.toLowerCase().includes("invalid")) {
          setErrors({ general: "Invalid username or password" });
        } else {
          setErrors({ general: msg });
        }
        return;
      }

      // Hydrate user data into state
      dispatch({ type: "HYDRATE", payload: { user: response.data?.user } });

      // Save to localStorage
      try { localStorage.setItem("mr_app_state_v1", JSON.stringify({ ...state, user: response.data?.user })); } catch (e) { }

      // Show welcome screen
      setShowWelcome(true);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setErrors({ general: "Unexpected error" });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/90 p-4">
      {!showWelcome ? (
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-1">MuscleRise</h2>
          <p className="text-sm text-foreground/70 mb-4">{mode === "register" ? "Register and start your fitness journey." : "Log in to your account."}</p>

          {mode === "register" ? (
            <form onSubmit={register} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-foreground/70">Username</span>
                <input className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" required />
                {errors.username && <div className="text-xs text-red-400">{errors.username}</div>}
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-foreground/70">Password</span>
                <PasswordInput className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" required />
                {errors.password && <div className="text-xs text-red-400">{errors.password}</div>}
              </label>


              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs text-foreground/70">Weight (kg)</span>
                  <input type="number" min={1} className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="70" required />
                  {errors.weightKg && <div className="text-xs text-red-400">{errors.weightKg}</div>}
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-foreground/70">Height (cm)</span>
                  <input type="number" min={1} className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="170" required />
                  {errors.heightCm && <div className="text-xs text-red-400">{errors.heightCm}</div>}
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs text-foreground/70">Avatar URL (optional)</span>
                <input className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://...jpg" />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-foreground/70">Choose a starter plan</span>
                <div className="flex items-center gap-2">
                  <select
                    value={form.planId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, planId: v });
                      if (v === "make-yourself") setShowMakeYourself(true);
                    }}
                    className="rounded-md bg-black/40 border border-white/10 px-4 py-2 pr-10 font-semibold"
                  >
                    {state.workoutPlans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="make-yourself">Make yourself</option>
                  </select>
                </div>
              </label>
              {errors.planId && <div className="text-xs text-red-400 mt-1">{errors.planId}</div>}

              {/* Make Yourself Modal */}
              {showMakeYourself && (
                <div className="fixed inset-0 z-[210] grid place-items-center bg-black/90 p-4">
                  <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl" style={{ overflowX: 'hidden' }}>
                    <h3 className="text-xl font-semibold mb-2">Make yourself — choose exercises</h3>
                    <p className="text-sm text-foreground/70 mb-4">Select up to 5 exercises and set repetitions/distances.</p>

                    <MakeYourselfComponent
                      availableExercises={availableExercises}
                      onClose={() => setShowMakeYourself(false)}
                      onSave={(selected) => {
                        setSelectedExercises(selected);
                        setShowMakeYourself(false);
                        // set a custom plan id so registration knows
                        setForm({ ...form, planId: "custom" });
                      }}
                    />

                  </div>
                </div>
              )}

              {errors.general && <div className="text-sm text-red-400 mb-2">{errors.general}</div>}
              <div className="flex items-center justify-between">
                <button type="submit" className="mt-2 rounded-md bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-2 font-semibold hover:from-emerald-400 hover:to-sky-400">Register</button>
                <button type="button" onClick={() => setMode("login")} className="text-sm underline">Already have an account? Login</button>
              </div>
            </form>
          ) : (
            <form onSubmit={login} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-foreground/70">Username</span>
                <input className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" required />
                {errors.username && <div className="text-xs text-red-400">{errors.username}</div>}
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-foreground/70">Password</span>
                <PasswordInput className="rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" required />
                {errors.password && <div className="text-xs text-red-400">{errors.password}</div>}
              </label>

              {errors.general && <div className="text-sm text-red-400 mb-2">{errors.general}</div>}
              <div className="flex items-center justify-between">
                <button type="submit" className="mt-2 rounded-md bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-2 font-semibold hover:from-emerald-400 hover:to-sky-400">Login</button>
                <button type="button" onClick={() => setMode("register")} className="text-sm underline">Don't have an account? Register</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 p-8 text-center shadow-2xl">
          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Welcome!</h3>
          <p className="mt-2 text-foreground/70">Ready for today's workout?</p>
          <button onClick={() => setShowWelcome(false)} className="mt-6 rounded-md bg-white/10 px-4 py-2 hover:bg-white/15">Get started</button>
        </div>
      )}
    </div>
  );
});
