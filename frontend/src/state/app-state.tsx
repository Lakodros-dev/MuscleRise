import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { setStorageItem, getStorageItem, removeStorageItem } from "@/lib/storage-utils";

export type Exercise = {
  id: string;
  name: string;
  caloriesPerRep: number;
  targetReps: number;
  completedReps: number;
  completed?: boolean; // Daily completion status
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
  language: string; // Current language
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
  | { type: "LOAD_WORKOUT_DATA"; payload: { workoutHistory: any[]; todayStats: any } }
  | { type: "TOGGLE_WHITE_THEME"; payload: { enabled: boolean } }
  | { type: "TOGGLE_MUSCLE_BOOST"; payload: { enabled: boolean } }
  | { type: "ADMIN_SET_DATE"; payload: { date: string } }
  | { type: "ADMIN_NEXT_DAY" }
  | { type: "ADMIN_PREV_DAY" }
  | { type: "ADMIN_RESET_DATE" }
  | { type: "SET_LANGUAGE"; payload: { language: string } }
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
        { id: "pushups", name: "Push-ups", caloriesPerRep: 0.5, targetReps: 10, completedReps: 0, completed: false },
        { id: "squats", name: "Squats", caloriesPerRep: 0.4, targetReps: 15, completedReps: 0, completed: false },
        { id: "plank", name: "Plank (sec)", caloriesPerRep: 0.2, targetReps: 30, completedReps: 0, completed: false },
        { id: "wall-sits", name: "Wall Sits (sec)", caloriesPerRep: 0.3, targetReps: 20, completedReps: 0, completed: false },
        { id: "leg-raises", name: "Leg Raises", caloriesPerRep: 0.4, targetReps: 8, completedReps: 0, completed: false },
      ],
    },
    {
      id: "middle",
      name: "Middle Level",
      exercises: [
        { id: "pushups", name: "Push-ups", caloriesPerRep: 0.6, targetReps: 25, completedReps: 0, completed: false },
        { id: "squats", name: "Squats", caloriesPerRep: 0.5, targetReps: 35, completedReps: 0, completed: false },
        { id: "lunges", name: "Lunges", caloriesPerRep: 0.7, targetReps: 20, completedReps: 0, completed: false },
        { id: "mountain-climbers", name: "Mountain Climbers", caloriesPerRep: 0.8, targetReps: 30, completedReps: 0, completed: false },
        { id: "plank", name: "Plank (sec)", caloriesPerRep: 0.3, targetReps: 60, completedReps: 0, completed: false },
        { id: "jumping-jacks", name: "Jumping Jacks", caloriesPerRep: 0.3, targetReps: 50, completedReps: 0, completed: false },
        { id: "russian-twists", name: "Russian Twists", caloriesPerRep: 0.4, targetReps: 25, completedReps: 0, completed: false },
      ],
    },
    {
      id: "hardcore",
      name: "Hardcore Level",
      exercises: [
        { id: "burpees", name: "Burpees", caloriesPerRep: 1.2, targetReps: 20, completedReps: 0, completed: false },
        { id: "diamond-pushups", name: "Diamond Push-ups", caloriesPerRep: 0.9, targetReps: 15, completedReps: 0, completed: false },
        { id: "jump-squats", name: "Jump Squats", caloriesPerRep: 0.8, targetReps: 25, completedReps: 0, completed: false },
        { id: "pike-pushups", name: "Pike Push-ups", caloriesPerRep: 0.8, targetReps: 12, completedReps: 0, completed: false },
        { id: "bear-crawls", name: "Bear Crawls", caloriesPerRep: 1.0, targetReps: 20, completedReps: 0, completed: false },
        { id: "single-leg-glute-bridge", name: "Single Leg Glute Bridge", caloriesPerRep: 0.6, targetReps: 15, completedReps: 0, completed: false },
        { id: "bicycle-crunches", name: "Bicycle Crunches", caloriesPerRep: 0.5, targetReps: 40, completedReps: 0, completed: false },
        { id: "high-knees", name: "High Knees", caloriesPerRep: 0.7, targetReps: 50, completedReps: 0, completed: false },
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
  let parsed: AppState | null = getStorageItem(STORAGE_KEY);

  // Load admin date override separately (persists across sessions until page reload)
  const adminDateOverride = getStorageItem(ADMIN_DATE_KEY) || undefined;

  // Load language from localStorage with proper validation
  let savedLanguage = 'en';
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('language');
      const validLanguages = ['en', 'uz', 'ru'];
      if (stored && validLanguages.includes(stored)) {
        savedLanguage = stored;
      }
    } catch (e) {
      console.warn('Failed to load language from localStorage:', e);
    }
  }

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
    language: savedLanguage,
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
      const updatedUser = { ...state.user, ...action.payload };
      let newState = { ...state, user: updatedUser };

      // If custom exercises were updated, regenerate workout plans
      if (action.payload.customExercises) {
        console.log('🔄 Regenerating workout plans with custom exercises');
        const seeded = seedWorkoutPlans();

        if (action.payload.customExercises.length > 0) {
          const customPlan = {
            id: "custom-plan",
            name: action.payload.customPlanName || "Custom Plan",
            exercises: action.payload.customExercises.map((ex: any) => ({
              id: ex.id || ex.name,
              name: ex.name,
              caloriesPerRep: 0.5,
              targetReps: ex.reps || ex.qty || 10,
              completedReps: 0,
              completed: false
            }))
          };
          newState.workoutPlans = [...seeded, customPlan];
          // Automatically select the custom plan
          newState.workoutPlanId = "custom-plan";
          console.log('✅ Custom plan added and selected automatically');
        } else {
          newState.workoutPlans = seeded;
        }
      }

      return newState;
    }
    case "SELECT_PLAN": {
      const newState = { ...state, workoutPlanId: action.payload.planId };

      // Save to server if user is logged in
      if (state.user?.id) {
        import("@/lib/api-utils").then(({ updateUser }) => {
          updateUser(state.user.id, { planId: action.payload.planId });
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
          const newCompletedReps = e.completedReps + reps;
          return {
            ...e,
            completedReps: newCompletedReps,
            completed: newCompletedReps >= e.targetReps
          };
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

      // Save workout completion to MongoDB if user is logged in
      if (state.user?.id) {
        import("@/lib/api-utils").then(({ completeWorkout, updateUser }) => {
          // Send workout completion to server
          completeWorkout({
            exercises: [{
              id: action.payload.exerciseId,
              name: ex.name,
              targetReps: ex.targetReps,
              completedReps: action.payload.reps,
              caloriesBurned: addedCalories
            }],
            totalCalories: addedCalories,
            planId: action.payload.planId
          }).then(response => {
            if (response.success) {
              console.log('✅ Workout saved to MongoDB:', response.data);
              // Update coins from server response
              if (response.data.user) {
                console.log('💰 Updating coins from server:', response.data.user.coins);
              }
            } else {
              console.warn('❌ Failed to save workout to MongoDB:', response.error);
            }
          }).catch(e => console.warn('❌ Error saving workout to MongoDB:', e));
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
          import("@/lib/api-utils").then(({ updateUser }) => {
            updateUser(state.user.id, {
              coins: newState.coins,
              themeSkin: action.payload.id,
              themeUnlockedSkins: unlocked,
              themePrimaryChoicesOwned: primaryOwned
            });
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
        import("@/lib/api-utils").then(({ updateUser }) => {
          updateUser(state.user.id, {
            themeSkin: action.payload.id,
            themeUnlockedSkins: newState.theme.unlockedSkins,
            themeOutfitsUnlocked: newState.theme.outfitsUnlocked,
            themePrimaryChoicesOwned: newState.theme.primaryChoicesOwned,
            themeWhiteThemeEnabled: newState.theme.whiteThemeEnabled
          });
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
        // load today's stats from server user's dailyStats if present
        const todayKey = appDayKey(new Date(), next.adminDateOverride);
        if (u.dailyStats && u.dailyStats.date === todayKey) {
          next.today = {
            date: todayKey,
            calories: u.dailyStats.calories || 0,
            exercisesCompleted: u.dailyStats.exercisesCompleted || 0
          };
          console.log('📊 Loaded today stats from server dailyStats:', next.today);
        } else {
          next.today = { date: todayKey, calories: 0, exercisesCompleted: 0 };
          console.log('📊 Initialized empty today stats');
        }
        // load history from server user if present
        next.history = u.dailyHistory ?? [];
        // Use server userPlans if available, otherwise use seeded plans
        let workoutPlans = seedWorkoutPlans();
        if (u.userPlans && u.userPlans.length > 0) {
          if (import.meta.env.DEV) {
            console.log('📋 Loading workout plans from server:', u.userPlans);
          }
          workoutPlans = u.userPlans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            exercises: plan.exercises.map((ex: any) => ({
              id: ex.id,
              name: ex.name,
              caloriesPerRep: ex.caloriesPerRep || 0.5,
              targetReps: ex.targetReps || 10,
              completedReps: ex.completedReps || 0,
              completed: ex.completed === true || (ex.completedReps >= ex.targetReps)
            }))
          }));
          if (import.meta.env.DEV) {
            console.log('✅ Loaded userPlans with completed states:', workoutPlans.map(p => ({
              name: p.name,
              exercises: p.exercises.map(e => ({
                name: e.name,
                completed: e.completed,
                completedReps: e.completedReps,
                targetReps: e.targetReps
              }))
            })));
          }
        }
        next.workoutPlans = workoutPlans;
        // Use user's saved currentPlanId first, then planId, otherwise use default
        next.workoutPlanId = u.currentPlanId || u.planId || selectPlanForDate(todayKey, workoutPlans);
        console.log('🎯 Setting workoutPlanId:', next.workoutPlanId, 'from currentPlanId:', u.currentPlanId, 'planId:', u.planId);

        // Add custom exercises plan if user has custom exercises (only if not already in userPlans)
        console.log('🏋️ Checking custom exercises:', u.customExercises);
        if (u.customExercises && u.customExercises.length > 0) {
          const hasCustomPlan = workoutPlans.some(plan => plan.id === "custom-plan");
          if (!hasCustomPlan) {
            console.log('✅ Found custom exercises, creating custom plan:', u.customExercises);
            const customPlan = {
              id: "custom-plan",
              name: u.customPlanName || "Custom Plan",
              exercises: u.customExercises.map((ex: any) => ({
                id: ex.id || ex.name,
                name: ex.name,
                caloriesPerRep: 0.5,
                targetReps: ex.reps || ex.qty || 10,
                completedReps: 0,
                completed: false
              }))
            };
            next.workoutPlans = [...workoutPlans, customPlan];
            console.log('📋 Added custom plan to workout plans');
          }

          // If user had selected custom plan, make sure it's selected
          if (u.planId === "custom-plan" || u.currentPlanId === "custom-plan") {
            next.workoutPlanId = "custom-plan";
            console.log('🎯 Selected custom plan as active');
          }
        } else {
          console.log('❌ No custom exercises found or empty array');
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
          console.log('🎨 Loaded theme settings from server:', next.theme);
        }

        // Load custom primary color if available
        if (u.customPrimaryColor) {
          // Apply the saved primary color immediately with higher priority
          const applyColor = (isRetry = false) => {
            try {
              if (!isRetry && import.meta.env.DEV) {
                console.log('🎨 Loading saved primary color:', u.customPrimaryColor);
              }

              if (u.customPrimaryColor?.startsWith('#')) {
                // Hex to RGB conversion
                const hex = u.customPrimaryColor.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const rgbValue = `${r}, ${g}, ${b}`;
                document.documentElement.style.setProperty('--primary-rgb', rgbValue);
                if (!isRetry && import.meta.env.DEV) {
                  console.log('✅ Applied hex color to DOM:', rgbValue);
                }
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
                  if (!isRetry && import.meta.env.DEV) {
                    console.log('✅ Applied HSL color to DOM:', rgbValue);
                  }
                }
              }
            } catch (e) {
              console.warn('❌ Failed to apply saved primary color:', e);
            }
          };

          // Apply immediately and also with a small delay to override any theme defaults
          applyColor();
          setTimeout(() => applyColor(true), 50);
          setTimeout(() => applyColor(true), 200);
        } else if (import.meta.env.DEV) {
          console.log('ℹ️ No custom primary color found for user');
        }
        // Rank will be fetched from server separately
        next.rank = { position: 1, total: 1 };
      }

      // Mark HYDRATE time to avoid immediate sync conflicts
      (window as any).__lastHydrateTime = Date.now();

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
      setStorageItem(ADMIN_DATE_KEY, newDate);
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
      setStorageItem(ADMIN_DATE_KEY, newDate);
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
      setStorageItem(ADMIN_DATE_KEY, newDate);
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
      removeStorageItem(ADMIN_DATE_KEY);
      return { ...state, adminDateOverride: undefined, today: newToday, workoutPlans: workoutData.plans, workoutPlanId: workoutData.planId, dateWorkoutDataMap };
    }
    case "SET_LANGUAGE": {
      // Save language to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', action.payload.language);
      }
      return { ...state, language: action.payload.language };
    }
    case "LOAD_WORKOUT_DATA": {
      // Update today's stats from MongoDB data (without changing workout plans)
      const todayStats = action.payload.todayStats;
      const workoutHistory = action.payload.workoutHistory;

      if (import.meta.env.DEV) {
        console.log('📊 Loading workout data:', { todayStats, workoutHistoryCount: workoutHistory.length });
      }

      let updatedState = { ...state };

      // Only update today's stats, don't touch workout plans or workoutPlanId
      if (todayStats) {
        updatedState.today = {
          date: state.today.date,
          calories: todayStats.totalCalories || 0,
          exercisesCompleted: todayStats.totalExercises || 0,
        };
        if (import.meta.env.DEV) {
          console.log('✅ Updated today stats from server:', updatedState.today);
        }
      }

      return updatedState;
    }
    case "LOGOUT": {
      // Clear all authentication and app data from localStorage
      removeStorageItem(STORAGE_KEY);
      removeStorageItem('auth_token');
      removeStorageItem('authToken');
      removeStorageItem('user');

      // Reset to initial app state with no user
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Authentication check and user data loading
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndLoadUser = async () => {
      try {
        // Import auth manager
        const { authManager, getCurrentUser } = await import("@/lib/api-utils");

        // Check if we have a token
        console.log('🔍 Auth check: isAuthenticated =', authManager.isAuthenticated());
        if (authManager.isAuthenticated() && isMounted) {
          console.log('🔐 Token found, verifying with server...');

          // Verify token and get current user
          const response = await getCurrentUser();

          if (response.success && response.data?.user && isMounted) {
            console.log('✅ User authenticated:', response.data.user.username);
            console.log('🏋️ User custom exercises from server:', response.data.user.customExercises);

            // Update state with fresh user data
            dispatch({ type: "HYDRATE", payload: { user: response.data.user } });

            // Load workout data from MongoDB
            setTimeout(async () => {
              try {
                const { getWorkoutHistory, getTodayWorkoutStats, makeApiRequest } = await import("@/lib/api-utils");

                // Load workout history and today's stats
                const [historyResponse, todayResponse, rankResponse] = await Promise.all([
                  getWorkoutHistory(),
                  getTodayWorkoutStats(),
                  makeApiRequest(`/auth/user/${response.data.user.id}/rank`)
                ]);

                // Update workout data
                if (historyResponse.success || todayResponse.success) {
                  dispatch({
                    type: "LOAD_WORKOUT_DATA",
                    payload: {
                      workoutHistory: historyResponse.data?.history || [],
                      todayStats: todayResponse.data?.todayStats || null
                    }
                  });
                  console.log('✅ Workout data loaded from MongoDB');
                }

                // Update rank
                if (rankResponse.success && rankResponse.data?.rank) {
                  console.log('🏆 Initial rank loaded:', rankResponse.data.rank);
                  dispatch({ type: "SET_RANK", payload: rankResponse.data.rank });
                }
              } catch (e) {
                console.warn('Failed to load workout data or rank:', e);
              }
            }, 100);

            // Apply saved primary color if exists
            if (response.data.user.customPrimaryColor && isMounted) {
              console.log('🎨 Found saved primary color:', response.data.user.customPrimaryColor);
              if (response.data.user.customPrimaryColor.startsWith('#')) {
                const hex = response.data.user.customPrimaryColor.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const rgbValue = `${r}, ${g}, ${b}`;
                document.documentElement.style.setProperty('--primary-rgb', rgbValue);
                console.log('✅ Applied primary color from server:', rgbValue);
              }
            }
          } else if (isMounted) {
            console.log('❌ Token invalid, clearing auth...');
            // Token is invalid, clear it
            authManager.clearToken();
            dispatch({ type: "LOGOUT" });
          }
        } else if (state.user && !authManager.isAuthenticated() && isMounted) {
          console.log('🚪 No token but user in state, logging out...');
          // User in state but no token, clear user
          dispatch({ type: "LOGOUT" });
        }
      } catch (error) {
        if (isMounted) {
          console.warn('Auth check failed:', error);
          // On error, clear auth to be safe
          const { authManager } = await import("@/lib/api-utils");
          authManager.clearToken();
          dispatch({ type: "LOGOUT" });
        }
      }
    };

    checkAuthAndLoadUser();

    return () => {
      isMounted = false;
    };
  }, [state.user?.id]); // Run when user changes

  // Initial loading with minimum 3 seconds
  useEffect(() => {
    const startTime = Date.now();
    const minLoadingTime = 3000; // 3 seconds

    const finishLoading = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        setIsInitialLoading(false);
      }, remainingTime);
    };

    // Wait for authentication check to complete
    const checkComplete = () => {
      // If user is set or auth check failed, we can finish loading
      if (state.user !== null || !getStorageItem('auth_token')) {
        finishLoading();
      } else {
        // Check again in 100ms
        setTimeout(checkComplete, 100);
      }
    };

    // Start checking after a small delay to let auth check begin
    setTimeout(checkComplete, 500);
  }, [state.user]);

  // Simple 3-second minimum loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
          const { makeApiRequest } = await import("@/lib/api-utils");
          console.log('🔍 Fetching rank for user:', state.user.id);
          const response = await makeApiRequest(`/auth/user/${state.user.id}/rank`);

          console.log('📊 Rank response:', response);
          if (response.success && response.data?.rank && isMounted) {
            console.log('✅ Setting rank:', response.data.rank);
            dispatch({ type: "SET_RANK", payload: response.data.rank });
          } else if (isMounted) {
            console.error('❌ Rank API failed:', response.error);
            // Try to get users count from users API
            try {
              const usersResponse = await makeApiRequest('/auth/users');
              if (usersResponse.success && usersResponse.data?.users) {
                const totalUsers = usersResponse.data.users.length;
                const fallbackRank = { position: totalUsers, total: totalUsers };
                console.log('🔄 Using fallback rank:', fallbackRank);
                dispatch({ type: "SET_RANK", payload: fallbackRank });
              }
            } catch (e) {
              console.error('❌ Fallback rank also failed:', e);
            }
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
          import("@/lib/api-utils").then(({ makeApiRequest }) => {
            return makeApiRequest(`/auth/user/${state.user.id}/rank`);
          })
            .then(response => {
              if (response.success && response.data?.rank && isMounted) {
                if (import.meta.env.DEV) {
                  console.log('🔄 Periodic rank update:', response.data.rank);
                }
                dispatch({ type: "SET_RANK", payload: response.data.rank });
              } else if (isMounted) {
                console.warn('Periodic rank update failed:', response.error);
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

  // Listen for language changes in localStorage (for cross-tab sync and page refresh)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue) {
        const validLanguages = ['en', 'uz', 'ru'];
        if (validLanguages.includes(e.newValue)) {
          dispatch({ type: "SET_LANGUAGE", payload: { language: e.newValue } });
        }
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Also check on mount in case language was changed before this component mounted
    const currentLang = localStorage.getItem('language');
    if (currentLang && ['en', 'uz', 'ru'].includes(currentLang) && currentLang !== state.language) {
      dispatch({ type: "SET_LANGUAGE", payload: { language: currentLang } });
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [state.language]);

  // persist locally with debounce (exclude adminDateOverride from main state)
  useEffect(() => {
    const id = setTimeout(() => {
      const { adminDateOverride, ...stateToSave } = state;
      setStorageItem(STORAGE_KEY, stateToSave);
    }, 300);
    return () => clearTimeout(id);
  }, [state]);

  // persist certain user-scoped values to server when logged in (debounced)
  const serverSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedDataRef = useRef<string>('');

  useEffect(() => {
    if (serverSyncTimeoutRef.current) {
      clearTimeout(serverSyncTimeoutRef.current);
    }

    const save = async () => {
      if (!state.user?.id) return; // Ensure we have a valid user ID

      // Create sync data object
      const syncData = {
        coins: state.coins,
        todayCalories: state.today.calories,
        todayExercises: state.today.exercisesCompleted,
        weightKg: state.user.weightKg,
        heightCm: state.user.heightCm,
        planId: state.workoutPlanId,
        userPlans: state.workoutPlans, // Include workout plans with completed states
        themeSkin: state.theme.skin,
        themeUnlockedSkins: state.theme.unlockedSkins,
        themeOutfitsUnlocked: state.theme.outfitsUnlocked,
        themePrimaryChoicesOwned: state.theme.primaryChoicesOwned,
        themeWhiteThemeEnabled: state.theme.whiteThemeEnabled,
        customPrimaryColor: getCurrentPrimaryColorValue(),
        dailyHistory: state.history,
        dateWorkoutDataMap: state.dateWorkoutDataMap
      };

      // Check if data has actually changed
      const currentDataString = JSON.stringify(syncData);
      if (currentDataString === lastSyncedDataRef.current) {
        return; // No changes, skip sync
      }

      // Don't sync immediately after HYDRATE to avoid conflicts
      if (Date.now() - (window as any).__lastHydrateTime < 5000) {
        if (import.meta.env.DEV) {
          console.log('⏳ Skipping sync - too soon after HYDRATE');
        }
        return;
      }

      try {
        const { updateUser } = await import("@/lib/api-utils");
        const response = await updateUser(state.user.id, syncData);

        if (response.success) {
          lastSyncedDataRef.current = currentDataString;
          if (import.meta.env.DEV) {
            console.log('✅ User data synced successfully');
          }
        } else {
          console.warn('❌ Failed to sync user data:', response.error);
        }
      } catch (e) {
        console.warn('❌ Failed to sync user data to server:', e);
      }
    };

    // debounce - optimized to 5 seconds for better UX
    serverSyncTimeoutRef.current = setTimeout(save, 5000);

    return () => {
      if (serverSyncTimeoutRef.current) {
        clearTimeout(serverSyncTimeoutRef.current);
      }
    };
  }, [state.user?.id, state.coins, state.today.calories, state.today.exercisesCompleted, state.user?.weightKg, state.user?.heightCm, state.workoutPlanId, state.workoutPlans, state.theme.skin, state.theme.unlockedSkins, state.theme.outfitsUnlocked, state.theme.primaryChoicesOwned, state.theme.whiteThemeEnabled, state.history, state.dateWorkoutDataMap]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  // Show loading screen during initial load
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              MuscleRise
            </h1>
            <p className="text-gray-400 mt-2">Your Ultimate Fitness Journey</p>
          </div>

          {/* Animated Loader */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-sky-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>

          {/* Loading Text */}
          <div className="mt-6">
            <p className="text-gray-300 animate-pulse">Loading your fitness data...</p>
            <div className="flex justify-center mt-3 space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
