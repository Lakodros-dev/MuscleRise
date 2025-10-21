import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";

export type Exercise = {
  id: string;
  name: string;
  caloriesPerRep: number;
  targetReps: number;
  completedReps: number;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type UserProfile = {
  id?: string;
  username?: string;
  name?: string;
  weightKg: number;
  heightCm: number;
  avatarUrl?: string | null;
  musclesLevel: number; // visual scale
  customExercises?: any[]; // Custom exercises for "Make Yourself" plan
  customPlanName?: string; // Name for custom workout plan
  planId?: string; // Selected plan ID
};

export type StatsEntry = {
  date: string; // YYYY-MM-DD
  calories: number;
  exercisesCompleted: number;
};

export type Rank = { position: number; total: number };

export type ThemeState = {
  skin: string;
  unlockedSkins: string[];
  outfitsUnlocked: string[];
  primaryChoicesOwned?: string[];
  // admin-controlled white theme access
  whiteThemeEnabled?: boolean;
  // user-specific muscle boost
  muscleBoostEnabled?: boolean;
};

export type AppState = {
  user: UserProfile | null;
  coins: number;
  theme: ThemeState;
  workoutPlanId: string;
  workoutPlans: WorkoutPlan[];
  today: StatsEntry;
  history: StatsEntry[];
  rank: Rank;
  // Admin controls
  adminDateOverride?: string; // YYYY-MM-DD format for date simulation
  // Date-specific workout data
  dateWorkoutDataMap?: Record<string, {
    planId: string;
    plans: WorkoutPlan[];
  }>;
};

export type Action =
  | { type: "REGISTER_USER"; payload: { name?: string; weightKg: number; heightCm: number; avatarUrl?: string | null } }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserProfile> }
  | { type: "SELECT_PLAN"; payload: { planId: string } }
  | { type: "COMPLETE_EXERCISE"; payload: { planId: string; exerciseId: string; reps: number } }
  | { type: "PURCHASE"; payload: { itemType: "skin" | "outfit" | "muscle"; id: string; cost: number } }
  | { type: "APPLY_THEME"; payload: { id: string } }
  | { type: "ADD_COINS"; payload: { amount: number } }
  | { type: "SET_RANK"; payload: Rank }
  | { type: "RESET_TODAY_IF_NEEDED" }
  | { type: "HYDRATE"; payload: Partial<AppState> }
  | { type: "TOGGLE_WHITE_THEME"; payload: { enabled: boolean } }
  | { type: "TOGGLE_MUSCLE_BOOST"; payload: { enabled: boolean } }
  | { type: "ADMIN_SET_DATE"; payload: { date: string } }
  | { type: "ADMIN_NEXT_DAY" }
  | { type: "ADMIN_PREV_DAY" }
  | { type: "ADMIN_RESET_DATE" }
  | { type: "LOGOUT" };

const STORAGE_KEY = "mr_app_state_v1";
const ADMIN_DATE_KEY = "mr_admin_date_override";

// App day starts at 06:00 local time. If current local time is before 06:00,
// the app day key belongs to the previous date.
// Admin can override the date for testing purposes.
function appDayKey(now = new Date(), adminOverride?: string) {
  if (adminOverride) {
    return adminOverride;
  }
  
  const local = new Date(now);
  const hour = local.getHours();
  if (hour >= 6) return local.toISOString().slice(0, 10);
  const prev = new Date(local);
  prev.setDate(local.getDate() - 1);
  return prev.toISOString().slice(0, 10);
}

// Helper function to get current primary color value
function getCurrentPrimaryColorValue(): string | undefined {
  try {
    const rgbValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-rgb')
      .trim();
    
    if (rgbValue && rgbValue !== '16, 185, 129') { // Don't save default emerald
      // Convert RGB to hex for storage
      const [r, g, b] = rgbValue.split(',').map(v => parseInt(v.trim()));
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    }
  } catch (e) {
    console.warn('Failed to get current primary color:', e);
  }
  return undefined;
}

function seedWorkoutPlans(): WorkoutPlan[] {
  return [
    {
      id: "beginner",
      name: "Beginner Level",
      exercises: [
        { id: "pushups", name: "Push-ups", caloriesPerRep: 0.5, targetReps: 10, completedReps: 0 },
        { id: "squats", name: "Squats", caloriesPerRep: 0.4, targetReps: 15, completedReps: 0 },
        { id: "plank", name: "Plank (sec)", caloriesPerRep: 0.2, targetReps: 30, completedReps: 0 },
        { id: "wall-sits", name: "Wall Sits (sec)", caloriesPerRep: 0.3, targetReps: 20, completedReps: 0 },
        { id: "leg-raises", name: "Leg Raises", caloriesPerRep: 0.4, targetReps: 8, completedReps: 0 },
      ],
    },
    {
      id: "middle",
      name: "Middle Level",
      exercises: [
        { id: "pushups", name: "Push-ups", caloriesPerRep: 0.6, targetReps: 25, completedReps: 0 },
        { id: "squats", name: "Squats", caloriesPerRep: 0.5, targetReps: 35, completedReps: 0 },
        { id: "lunges", name: "Lunges", caloriesPerRep: 0.7, targetReps: 20, completedReps: 0 },
        { id: "mountain-climbers", name: "Mountain Climbers", caloriesPerRep: 0.8, targetReps: 30, completedReps: 0 },
        { id: "plank", name: "Plank (sec)", caloriesPerRep: 0.3, targetReps: 60, completedReps: 0 },
        { id: "jumping-jacks", name: "Jumping Jacks", caloriesPerRep: 0.3, targetReps: 50, completedReps: 0 },
        { id: "russian-twists", name: "Russian Twists", caloriesPerRep: 0.4, targetReps: 25, completedReps: 0 },
      ],
    },
    {
      id: "hardcore",
      name: "Hardcore Level",
      exercises: [
        { id: "burpees", name: "Burpees", caloriesPerRep: 1.2, targetReps: 20, completedReps: 0 },
        { id: "diamond-pushups", name: "Diamond Push-ups", caloriesPerRep: 0.9, targetReps: 15, completedReps: 0 },
        { id: "jump-squats", name: "Jump Squats", caloriesPerRep: 0.8, targetReps: 25, completedReps: 0 },
        { id: "pike-pushups", name: "Pike Push-ups", caloriesPerRep: 0.8, targetReps: 12, completedReps: 0 },
        { id: "bear-crawls", name: "Bear Crawls", caloriesPerRep: 1.0, targetReps: 20, completedReps: 0 },
        { id: "single-leg-glute-bridge", name: "Single Leg Glute Bridge", caloriesPerRep: 0.6, targetReps: 15, completedReps: 0 },
        { id: "bicycle-crunches", name: "Bicycle Crunches", caloriesPerRep: 0.5, targetReps: 40, completedReps: 0 },
        { id: "high-knees", name: "High Knees", caloriesPerRep: 0.7, targetReps: 50, completedReps: 0 },
      ],
    },
  ];
}

function selectPlanForDate(dateStr: string, plans: WorkoutPlan[]) {
  // deterministic selection: use day of month to pick plan index
  const d = new Date(dateStr + "T00:00:00");
  const index = (d.getDate() - 1) % plans.length;
  return plans[index].id;
}

function initialState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  let parsed: AppState | null = null;
  
  if (saved) {
    try {
      parsed = JSON.parse(saved);
    } catch {}
  }
  
  // Load admin date override separately (persists across sessions until page reload)
  const adminDateOverride = localStorage.getItem(ADMIN_DATE_KEY) || undefined;
  
  const today = appDayKey(new Date(), adminDateOverride);
  // Get workout data for today
  const todayWorkoutData = getWorkoutDataForDate(today, parsed?.dateWorkoutDataMap, parsed?.user || null);
  
  // Load today's stats from parsed state if they match today's date
  let todayStats: StatsEntry;
  if (parsed?.today?.date === today) {
    todayStats = parsed.today;
  } else {
    // Initialize with zero values for today
    todayStats = { date: today, calories: 0, exercisesCompleted: 0 };
  }
  
  const baseState = {
    user: parsed?.user || null,
    coins: parsed?.coins || 0,
    theme: parsed?.theme || { skin: "default", unlockedSkins: ["default", "design-dark"], outfitsUnlocked: [], primaryChoicesOwned: [], whiteThemeEnabled: false, muscleBoostEnabled: false },
    workoutPlanId: todayWorkoutData.planId,
    workoutPlans: todayWorkoutData.plans,
    today: todayStats,
    history: parsed?.history || [],
    rank: parsed?.rank || { position: 1, total: 1 }, // Will be updated with real data when user logs in
    adminDateOverride,
    dateWorkoutDataMap: parsed?.dateWorkoutDataMap || {},
  };
  
  return baseState;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "REGISTER_USER": {
      const user: UserProfile = {
        name: action.payload.name ?? undefined,
        weightKg: action.payload.weightKg,
        heightCm: action.payload.heightCm,
        avatarUrl: action.payload.avatarUrl ?? null,
        musclesLevel: 1,
      };
      return { ...state, user };
    }
    case "UPDATE_SETTINGS": {
      if (!state.user) return state;
      return { ...state, user: { ...state.user, ...action.payload } };
    }
    case "SELECT_PLAN": {
      const newState = { ...state, workoutPlanId: action.payload.planId };
      
      // Save to server if user is logged in
      if (state.user?.id) {
        fetch(`/api/auth/user/${state.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: action.payload.planId }),
        }).catch(e => console.warn('Failed to save plan selection to server:', e));
      }
      
      return newState;
    }
    case "COMPLETE_EXERCISE": {
      const plans = state.workoutPlans.map((p) => {
        if (p.id !== action.payload.planId) return p;
        const exercises = p.exercises.map((e) => {
          if (e.id !== action.payload.exerciseId) return e;
          const reps = Math.max(0, Math.min(action.payload.reps, e.targetReps - e.completedReps));
          return { ...e, completedReps: e.completedReps + reps };
        });
        return { ...p, exercises };
      });
      // calculate calories and coins from this completion
      const plan = plans.find((p) => p.id === action.payload.planId)!;
      const ex = plan.exercises.find((e) => e.id === action.payload.exerciseId)!;
      const addedCalories = ex.caloriesPerRep * action.payload.reps;
      const addedCoins = Math.ceil(addedCalories); // 1 coin ~ 1 kcal
      const today = ensureToday(state.today, state.adminDateOverride);
      const updatedToday: StatsEntry = {
        ...today,
        calories: today.calories + addedCalories,
        exercisesCompleted: today.exercisesCompleted + action.payload.reps,
      };
      const history = upsertHistory(state.history, updatedToday);
      
      // Update date-workout data mapping when completing exercises
      const dateWorkoutDataMap = {
        ...state.dateWorkoutDataMap,
        [today.date]: {
          planId: action.payload.planId,
          plans: plans
        }
      };
      
      // Also update the server immediately for exercise completions
      if (state.user?.id) {
        fetch(`/api/auth/user/${state.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            todayCalories: updatedToday.calories,
            todayExercises: updatedToday.exercisesCompleted,
            dateWorkoutDataMap: dateWorkoutDataMap
          }),
        }).catch(e => console.warn('Failed to save exercise completion to server:', e));
      }
      
      return { ...state, workoutPlans: plans, today: updatedToday, history, coins: state.coins + addedCoins, dateWorkoutDataMap };
    }
    case "PURCHASE": {
      if (state.coins < action.payload.cost) return state;
      if (action.payload.itemType === "muscle") {
        const user = state.user ? { ...state.user, musclesLevel: Math.min(5, state.user.musclesLevel + 0.1) } : state.user;
        return { ...state, user, coins: state.coins - action.payload.cost };
      }
      if (action.payload.itemType === "skin") {
        const unlocked = Array.from(new Set([...
          state.theme.unlockedSkins,
          action.payload.id,
        ]));
        const primaryOwned = Array.from(new Set([...(state.theme.primaryChoicesOwned ?? []), ...(action.payload.id.startsWith("primary-") ? [action.payload.id] : [])]));
        const newState = { ...state, theme: { ...state.theme, unlockedSkins: unlocked, skin: action.payload.id, primaryChoicesOwned: primaryOwned }, coins: state.coins - action.payload.cost };
        
        // Save theme purchase to server if user is logged in
        if (state.user?.id) {
          fetch(`/api/auth/user/${state.user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              coins: newState.coins,
              themeSkin: action.payload.id,
              themeUnlockedSkins: unlocked,
              themePrimaryChoicesOwned: primaryOwned
            }),
          }).catch(e => console.warn('Failed to save theme purchase to server:', e));
        }
        
        return newState;
      }
      if (action.payload.itemType === "outfit") {
        const outfits = Array.from(new Set([...
          state.theme.outfitsUnlocked,
          action.payload.id,
        ]));
        return { ...state, theme: { ...state.theme, outfitsUnlocked: outfits }, coins: state.coins - action.payload.cost };
      }
      return state;
    }
    case "APPLY_THEME": {
      // Apply a theme that user already owns
      const newState = { ...state, theme: { ...state.theme, skin: action.payload.id } };
      
      // Save theme to server if user is logged in
      if (state.user?.id) {
        fetch(`/api/auth/user/${state.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            themeSkin: action.payload.id,
            themeUnlockedSkins: newState.theme.unlockedSkins,
            themeOutfitsUnlocked: newState.theme.outfitsUnlocked,
            themePrimaryChoicesOwned: newState.theme.primaryChoicesOwned,
            themeWhiteThemeEnabled: newState.theme.whiteThemeEnabled
          }),
        }).catch(e => console.warn('Failed to save theme to server:', e));
      }
      
      return newState;
    }
    case "ADD_COINS": {
      return { ...state, coins: state.coins + action.payload.amount };
    }
    case "SET_RANK": {
      return { ...state, rank: action.payload };
    }
    case "RESET_TODAY_IF_NEEDED": {
      const t = ensureToday(state.today, state.adminDateOverride);
      if (t !== state.today) {
        // push yesterday into history if it has data
        let history = state.history;
        if (state.today.calories > 0 || state.today.exercisesCompleted > 0) {
          history = upsertHistory(state.history, state.today);
        }
        // Only reset completedReps for natural date changes, not admin overrides
        const isNaturalDateChange = !state.adminDateOverride;
        
        if (isNaturalDateChange) {
          // For natural date changes, create new workout data
          const newWorkoutData = getWorkoutDataForDate(t.date, state.dateWorkoutDataMap, state.user);
          const dateWorkoutDataMap = {
            ...state.dateWorkoutDataMap,
            [t.date]: newWorkoutData
          };
          return { ...state, today: t, history, workoutPlans: newWorkoutData.plans, workoutPlanId: newWorkoutData.planId, dateWorkoutDataMap };
        } else {
          // For admin overrides, use existing workout data for the date
          const workoutData = getWorkoutDataForDate(t.date, state.dateWorkoutDataMap, state.user);
          const dateWorkoutDataMap = {
            ...state.dateWorkoutDataMap,
            [t.date]: workoutData
          };
          return { ...state, today: t, history, workoutPlans: workoutData.plans, workoutPlanId: workoutData.planId, dateWorkoutDataMap };
        }
      }
      return state;
    }
    case "HYDRATE": {
      // When hydrating with a user (login/register), load user-specific values
      const next = { ...state, ...action.payload } as AppState;
      if ((action.payload as any).user) {
        const u = (action.payload as any).user;
        // map server user to UserProfile shape - IMPORTANT: preserve the id
        next.user = {
          id: u.id,
          username: u.username,
          name: u.name ?? u.username,
          weightKg: typeof u.weightKg === "number" ? u.weightKg : state.user?.weightKg ?? 70,
          heightCm: typeof u.heightCm === "number" ? u.heightCm : state.user?.heightCm ?? 170,
          avatarUrl: u.avatarUrl ?? null,
          musclesLevel: u.musclesLevel ?? 1,
        };
        next.coins = typeof u.coins === "number" ? u.coins : 0;
        // load today's stats from server user if present
        const todayKey = appDayKey(new Date(), next.adminDateOverride);
        next.today = { date: todayKey, calories: u.todayCalories ?? 0, exercisesCompleted: u.todayExercises ?? 0 };
        // load history from server user if present
        next.history = u.dailyHistory ?? [];
        // set workout plans (seed) and choose plan id
        const seeded = seedWorkoutPlans();
        next.workoutPlans = seeded;
        // Use user's saved planId if available, otherwise use default
        next.workoutPlanId = u.planId ?? selectPlanForDate(todayKey, seeded);
        
        // Add custom exercises plan if user has custom exercises
        if (u.customExercises && u.customExercises.length > 0) {
          const customPlan = {
            id: "custom-plan",
            name: u.customPlanName || "Custom Plan",
            exercises: u.customExercises.map((ex: any) => ({
              id: ex.id || ex.name,
              name: ex.name,
              caloriesPerRep: 0.5,
              targetReps: ex.reps || ex.qty || 10,
              completedReps: 0
            }))
          };
          next.workoutPlans = [...seeded, customPlan];
          
          // If user had selected custom plan, make sure it's selected
          if (u.planId === "custom-plan") {
            next.workoutPlanId = "custom-plan";
          }
        }
        
        // Load theme settings from server if available
        if (u.themeSkin || u.themeUnlockedSkins || u.themeOutfitsUnlocked || u.themePrimaryChoicesOwned || u.themeWhiteThemeEnabled !== undefined || u.themeMuscleBoostEnabled !== undefined) {
          next.theme = {
            skin: u.themeSkin ?? next.theme.skin,
            unlockedSkins: u.themeUnlockedSkins ?? next.theme.unlockedSkins,
            outfitsUnlocked: u.themeOutfitsUnlocked ?? next.theme.outfitsUnlocked,
            primaryChoicesOwned: u.themePrimaryChoicesOwned ?? next.theme.primaryChoicesOwned,
            whiteThemeEnabled: u.themeWhiteThemeEnabled ?? next.theme.whiteThemeEnabled,
            muscleBoostEnabled: u.themeMuscleBoostEnabled ?? next.theme.muscleBoostEnabled
          };
        }
        
        // Load custom primary color if available
        if (u.customPrimaryColor) {
          // Apply the saved primary color immediately with higher priority
          const applyColor = () => {
            try {
              console.log('🎨 Loading saved primary color:', u.customPrimaryColor);
              
              if (u.customPrimaryColor?.startsWith('#')) {
                // Hex to RGB conversion
                const hex = u.customPrimaryColor.replace('#', '');
                const r = parseInt(hex.substring(0,2), 16);
                const g = parseInt(hex.substring(2,4), 16);
                const b = parseInt(hex.substring(4,6), 16);
                const rgbValue = `${r}, ${g}, ${b}`;
                document.documentElement.style.setProperty('--primary-rgb', rgbValue);
                console.log('✅ Applied hex color to DOM:', rgbValue);
              } else if (u.customPrimaryColor?.startsWith('hsl(')) {
                // HSL to RGB conversion for legacy colors
                const hslValues = u.customPrimaryColor.match(/\d+/g);
                if (hslValues && hslValues.length >= 3) {
                  const hsl = `${hslValues[0]} ${hslValues[1]}% ${hslValues[2]}%`;
                  // HSL to RGB conversion logic
                  const parts = hsl.trim().split(/\s+/);
                  const h = parseFloat(parts[0]);
                  const s = parseFloat(parts[1].replace("%", "")) / 100;
                  const l = parseFloat(parts[2].replace("%", "")) / 100;
                  const c = (1 - Math.abs(2 * l - 1)) * s;
                  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                  const m = l - c / 2;
                  let r = 0, g = 0, b = 0;
                  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
                  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
                  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
                  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
                  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
                  else { r = c; g = 0; b = x; }
                  const R = Math.round((r + m) * 255);
                  const G = Math.round((g + m) * 255);
                  const B = Math.round((b + m) * 255);
                  const rgbValue = `${R}, ${G}, ${B}`;
                  document.documentElement.style.setProperty('--primary-rgb', rgbValue);
                  console.log('✅ Applied HSL color to DOM:', rgbValue);
                }
              }
            } catch (e) {
              console.warn('❌ Failed to apply saved primary color:', e);
            }
          };
          
          // Apply immediately and also with a small delay to override any theme defaults
          applyColor();
          setTimeout(applyColor, 50);
          setTimeout(applyColor, 200);
        } else {
          console.log('ℹ️ No custom primary color found for user');
        }
        // Rank will be fetched from server separately
        next.rank = { position: 1, total: 1 };
      }
      return next;
    }
    case "TOGGLE_WHITE_THEME": {
      return { ...state, theme: { ...state.theme, whiteThemeEnabled: action.payload.enabled } };
    }
    case "TOGGLE_MUSCLE_BOOST": {
      return { ...state, theme: { ...state.theme, muscleBoostEnabled: action.payload.enabled } };
    }
    case "ADMIN_SET_DATE": {
      const newDate = action.payload.date;
      const newToday = { date: newDate, calories: state.today.calories, exercisesCompleted: state.today.exercisesCompleted };
      // Get workout data for the new date
      const workoutData = getWorkoutDataForDate(newDate, state.dateWorkoutDataMap, state.user);
      const dateWorkoutDataMap = {
        ...state.dateWorkoutDataMap,
        [newDate]: workoutData
      };
      // Persist admin date override
      localStorage.setItem(ADMIN_DATE_KEY, newDate);
      return { ...state, adminDateOverride: newDate, today: newToday, workoutPlans: workoutData.plans, workoutPlanId: workoutData.planId, dateWorkoutDataMap };
    }
    case "ADMIN_NEXT_DAY": {
      const currentDate = state.adminDateOverride || appDayKey();
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const newDate = nextDate.toISOString().slice(0, 10);
      const newToday = { date: newDate, calories: state.today.calories, exercisesCompleted: state.today.exercisesCompleted };
      // Get workout data for the new date
      const workoutData = getWorkoutDataForDate(newDate, state.dateWorkoutDataMap, state.user);
      const dateWorkoutDataMap = {
        ...state.dateWorkoutDataMap,
        [newDate]: workoutData
      };
      // Persist admin date override
      localStorage.setItem(ADMIN_DATE_KEY, newDate);
      return { ...state, adminDateOverride: newDate, today: newToday, workoutPlans: workoutData.plans, workoutPlanId: workoutData.planId, dateWorkoutDataMap };
    }
    case "ADMIN_PREV_DAY": {
      const currentDate = state.adminDateOverride || appDayKey();
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const newDate = prevDate.toISOString().slice(0, 10);
      const newToday = { date: newDate, calories: state.today.calories, exercisesCompleted: state.today.exercisesCompleted };
      // Get workout data for the new date
      const workoutData = getWorkoutDataForDate(newDate, state.dateWorkoutDataMap, state.user);
      const dateWorkoutDataMap = {
        ...state.dateWorkoutDataMap,
        [newDate]: workoutData
      };
      // Persist admin date override
      localStorage.setItem(ADMIN_DATE_KEY, newDate);
      return { ...state, adminDateOverride: newDate, today: newToday, workoutPlans: workoutData.plans, workoutPlanId: workoutData.planId, dateWorkoutDataMap };
    }
    case "ADMIN_RESET_DATE": {
      const realToday = appDayKey();
      // When resetting to real date, we should check if it's a new day and reset if needed
      const isNewDay = realToday !== state.today.date;
      const newToday = { date: realToday, calories: isNewDay ? 0 : state.today.calories, exercisesCompleted: isNewDay ? 0 : state.today.exercisesCompleted };
      
      // Get workout data for today
      const workoutData = getWorkoutDataForDate(realToday, state.dateWorkoutDataMap, state.user);
      const dateWorkoutDataMap = {
        ...state.dateWorkoutDataMap,
        [realToday]: workoutData
      };
      
      // Remove admin date override
      localStorage.removeItem(ADMIN_DATE_KEY);
      return { ...state, adminDateOverride: undefined, today: newToday, workoutPlans: workoutData.plans, workoutPlanId: workoutData.planId, dateWorkoutDataMap };
    }
    case "LOGOUT": {
      // Completely remove the app state from localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      // Also clear any other related storage items
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // reset to initial app state (clears coins, history, today, plans), keep no user
      const fresh = initialState();
      return { ...fresh, user: null };
    }
    default:
      return state;
  }
}

function getWorkoutDataForDate(date: string, dateWorkoutDataMap?: Record<string, { planId: string; plans: WorkoutPlan[] }>, user?: UserProfile | null): { planId: string; plans: WorkoutPlan[] } {
  // Check if we have date-specific workout data
  if (dateWorkoutDataMap && dateWorkoutDataMap[date]) {
    return dateWorkoutDataMap[date];
  }
  
  // Default behavior - generate seeded plans and select one based on date
  const seeded = seedWorkoutPlans();
  let plans = seeded;
  let planId = selectPlanForDate(date, seeded);
  
  // If user has custom exercises, add custom plan to the plans list
  if (user?.customExercises && user.customExercises.length > 0) {
    const customPlan = {
      id: "custom-plan",
      name: user.customPlanName || "Custom Plan",
      exercises: user.customExercises.map((ex: any) => ({
        id: ex.id || ex.name,
        name: ex.name,
        caloriesPerRep: 0.5,
        targetReps: ex.reps || ex.qty || 10,
        completedReps: 0
      }))
    };
    plans = [...seeded, customPlan];
    
    // If user had selected custom plan, make sure it's selected
    if (user.planId === "custom-plan") {
      planId = "custom-plan";
    }
  }
  
  return { planId, plans };
}

function ensureToday(today: StatsEntry, adminOverride?: string): StatsEntry {
  const current = appDayKey(new Date(), adminOverride);
  // Only reset if it's a natural date change (not admin override)
  if (!adminOverride && today.date !== current) {
    return { date: current, calories: 0, exercisesCompleted: 0 };
  }
  return today;
}

function upsertHistory(history: StatsEntry[], entry: StatsEntry): StatsEntry[] {
  const idx = history.findIndex((h) => h.date === entry.date);
  if (idx === -1) return [...history, entry];
  const copy = history.slice();
  copy[idx] = entry;
  return copy;
}

const AppStateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, initialState);

  // Load user and primary color on app initialization
  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      if (state.user?.id && isMounted) {
        try {
          console.log('🔄 Loading user data from server for user:', state.user.id);
          const response = await fetch(`/api/auth/user/${state.user.id}`, {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok && isMounted) {
            const data = await response.json();
            if (data.user?.customPrimaryColor && isMounted) {
              console.log('🎨 Found saved primary color in server:', data.user.customPrimaryColor);
              // Apply the saved primary color
              if (data.user.customPrimaryColor.startsWith('#')) {
                const hex = data.user.customPrimaryColor.replace('#', '');
                const r = parseInt(hex.substring(0,2), 16);
                const g = parseInt(hex.substring(2,4), 16);
                const b = parseInt(hex.substring(4,6), 16);
                const rgbValue = `${r}, ${g}, ${b}`;
                document.documentElement.style.setProperty('--primary-rgb', rgbValue);
                console.log('✅ Applied primary color from server:', rgbValue);
              }
            }
          }
        } catch (e) {
          if (isMounted) {
            console.warn('Failed to load user data from server:', e);
          }
        }
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [state.user?.id]);

  // reset today when date changes and fetch real rank data
  const todayDateRef = useRef(state.today.date);
  const todayCaloriesRef = useRef(state.today.calories);
  const userIdRef = useRef(state.user?.id);
  
  useEffect(() => {
    // Only dispatch if date actually changed
    if (todayDateRef.current !== state.today.date) {
      dispatch({ type: "RESET_TODAY_IF_NEEDED" });
      todayDateRef.current = state.today.date;
    }
  }, [state.today.date]);
  
  useEffect(() => {
    let isMounted = true;
    
    // Fetch real rank from server if user is logged in
    const fetchRealRank = async () => {
      if (state.user?.id && isMounted) {
        try {
          const response = await fetch(`/api/auth/user/${state.user.id}/rank`, {
            signal: AbortSignal.timeout(5000)
          });
          if (response.ok && isMounted) {
            const data = await response.json();
            dispatch({ type: "SET_RANK", payload: data.rank });
          } else if (isMounted) {
            // Fallback to simple rank calculation if server fails
            const base = 100;
            const better = Math.min(base - 1, Math.max(1, base - Math.floor(state.today.calories / 50)));
            dispatch({ type: "SET_RANK", payload: { position: better, total: base } });
          }
        } catch (e) {
          if (isMounted) {
            // Fallback to simple rank calculation
            const base = 100;
            const better = Math.min(base - 1, Math.max(1, base - Math.floor(state.today.calories / 50)));
            dispatch({ type: "SET_RANK", payload: { position: better, total: base } });
          }
        }
      } else if (!state.user?.id && isMounted) {
        // For guests, use simple fake ranking
        const base = 1000;
        const better = Math.min(base - 1, Math.max(1, base - Math.floor(state.today.calories / 50)));
        dispatch({ type: "SET_RANK", payload: { position: better, total: base } });
      }
    };
    
    // Only fetch if significant values changed
    if (todayDateRef.current !== state.today.date || 
        Math.abs(todayCaloriesRef.current - state.today.calories) >= 10 || 
        userIdRef.current !== state.user?.id) {
      fetchRealRank();
      todayDateRef.current = state.today.date;
      todayCaloriesRef.current = state.today.calories;
      userIdRef.current = state.user?.id;
    }
    
    return () => {
      isMounted = false;
    };
  }, [state.today.date, state.today.calories, state.user?.id]);

  // periodic check to ensure we reset at 06:00 local time and update rankings
  useEffect(() => {
    let isMounted = true;
    
    const id = setInterval(() => {
      if (isMounted) {
        dispatch({ type: "RESET_TODAY_IF_NEEDED" });
        
        // Also refresh rankings every 5 minutes for logged-in users
        if (state.user?.id) {
          fetch(`/api/auth/user/${state.user.id}/rank`, {
            signal: AbortSignal.timeout(5000)
          })
            .then(res => res.json())
            .then(data => {
              if (data.rank && isMounted) {
                dispatch({ type: "SET_RANK", payload: data.rank });
              }
            })
            .catch(e => {
              if (isMounted) {
                console.warn('Failed to update rank:', e);
              }
            });
        }
      }
    }, 5 * 60 * 1000); // check every 5 minutes
    
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [dispatch, state.user?.id]);

  // persist locally with debounce (exclude adminDateOverride from main state)
  useEffect(() => {
    const id = setTimeout(() => {
      const { adminDateOverride, ...stateToSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, 300);
    return () => clearTimeout(id);
  }, [state]);

  // persist certain user-scoped values to server when logged in (debounced)
  const serverSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (serverSyncTimeoutRef.current) {
      clearTimeout(serverSyncTimeoutRef.current);
    }
    
    const save = async () => {
      if (!state.user?.id) return; // Ensure we have a valid user ID
    
      try {
        await fetch(`/api/auth/user/${state.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            coins: state.coins, 
            todayCalories: state.today.calories, 
            todayExercises: state.today.exercisesCompleted, 
            weightKg: state.user.weightKg, 
            heightCm: state.user.heightCm,
            planId: state.workoutPlanId, // Include current planId in sync
            // Include theme settings in sync
            themeSkin: state.theme.skin,
            themeUnlockedSkins: state.theme.unlockedSkins,
            themeOutfitsUnlocked: state.theme.outfitsUnlocked,
            themePrimaryChoicesOwned: state.theme.primaryChoicesOwned,
            themeWhiteThemeEnabled: state.theme.whiteThemeEnabled,
            // Include custom primary color in sync
            customPrimaryColor: getCurrentPrimaryColorValue(),
            // Include daily history in sync
            dailyHistory: state.history,
            // Include date-workout data mapping
            dateWorkoutDataMap: state.dateWorkoutDataMap
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
      } catch (e) {
        console.warn('Failed to sync user data to server:', e);
      }
    };
    
    // debounce - increased to 3 seconds to reduce server load
    serverSyncTimeoutRef.current = setTimeout(save, 3000);
    
    return () => {
      if (serverSyncTimeoutRef.current) {
        clearTimeout(serverSyncTimeoutRef.current);
      }
    };
  }, [state.user?.id, state.coins, state.today.calories, state.today.exercisesCompleted, state.user?.weightKg, state.user?.heightCm, state.workoutPlanId, state.theme.skin, state.theme.unlockedSkins, state.theme.outfitsUnlocked, state.theme.primaryChoicesOwned, state.theme.whiteThemeEnabled, state.history, state.dateWorkoutDataMap]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext);
  if (ctx === undefined) {
    console.error("useAppState must be used within AppStateProvider. Current component might be rendered outside the React component tree.");
    // Return a default state to prevent crashes
    return {
      state: initialState(),
      dispatch: () => {
        console.warn("AppState dispatch called outside provider context");
      }
    };
  }
  return ctx;
}
