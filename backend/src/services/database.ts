import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { DATABASE_CONFIG } from '../config/database';

// MongoDB connection
let client: MongoClient | null = null;
let db: Db | null = null;
let usersCollection: Collection | null = null;

// Exercise interface
export interface Exercise {
  id: string;
  name: string;
  caloriesPerRep: number;
  targetReps: number;
  completedReps: number;
  completed?: boolean; // Daily completion status
}

// User Plan interface
export interface UserPlan {
  id: string;
  name: string;
  exercises: Exercise[];
  isCustom: boolean;
  createdAt: Date;
}

// Selected Exercise interface
export interface SelectedExercise {
  exerciseName: string;
  category: string;
  reps: number;
  dateAdded: string;
  timesUsed: number;
  lastUsed: string;
}

// Workout History Entry interface
export interface WorkoutHistoryEntry {
  id: string;
  date: string;
  exercises: Array<{
    id: string;
    name: string;
    targetReps: number;
    completedReps: number;
    caloriesBurned?: number;
  }>;
  totalCalories: number;
  duration?: number;
  planId?: string;
}

// Daily Stats interface
export interface DailyStats {
  date: string; // YYYY-MM-DD format
  calories: number;
  exercisesCompleted: number;
  workoutsCount: number;
  lastResetAt: Date;
}

// User interface
export interface User {
  _id?: ObjectId;
  id: string;
  username: string;
  passwordHash: string;
  weightKg: number;
  heightCm: number;
  avatarUrl?: string;
  currentPlanId: string;
  userPlans: UserPlan[]; // User's personal plans
  selectedExercises?: SelectedExercise[]; // User's selected exercises for tracking
  customExercises?: any[]; // Custom exercises for "Make Yourself" plan
  customPlanName?: string; // Name for custom workout plan
  planId?: string; // Selected plan ID
  coins: number;
  streak: number;
  totalWorkouts: number;
  totalExercises?: number; // Total exercises completed
  totalCalories?: number; // Total calories burned
  workoutHistory?: WorkoutHistoryEntry[]; // User's workout history
  dailyHistory?: Array<{ date: string; calories: number; exercisesCompleted: number }>; // Daily history
  lastWorkoutDate?: string; // Last workout date
  dailyStats?: DailyStats; // Today's stats
  lastDailyReset?: Date; // Last time daily exercises were reset
  // Theme settings
  customPrimaryColor?: string;
  themeSkin?: string;
  themeUnlockedSkins?: string[];
  themeOutfitsUnlocked?: string[];
  themePrimaryChoicesOwned?: string[];
  themeWhiteThemeEnabled?: boolean;
  themeMuscleBoostEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Initialize MongoDB connection
export async function initDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');

    client = new MongoClient(DATABASE_CONFIG.MONGO_URI, {
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    } as any);

    await client.connect();
    db = client.db(DATABASE_CONFIG.DB_NAME);
    usersCollection = db.collection('users');

    // Create indexes for better performance
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ id: 1 }, { unique: true });

    console.log('✅ Connected to MongoDB successfully');

    // Test the connection
    const count = await usersCollection.countDocuments();
    console.log(`✅ MongoDB connection verified - ${count} users in database`);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw new Error('MongoDB connection required for this application');
  }
}

// Close database connection
export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    usersCollection = null;
    console.log('🔐 MongoDB connection closed');
  }
}

// Check if MongoDB is available
export function isMongoDBAvailable(): boolean {
  return db !== null && usersCollection !== null;
}

// Create default plans for new user
function createDefaultPlans(): UserPlan[] {
  return [
    {
      id: "beginner",
      name: "Beginner Level",
      isCustom: false,
      createdAt: new Date(),
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
      isCustom: false,
      createdAt: new Date(),
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
      isCustom: false,
      createdAt: new Date(),
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

// User operations
export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'userPlans'>): Promise<User> {
  if (!usersCollection) throw new Error('Database not initialized');

  const user: User = {
    ...userData,
    userPlans: createDefaultPlans(),
    dailyStats: {
      date: getTodayKey(),
      calories: 0,
      exercisesCompleted: 0,
      workoutsCount: 0,
      lastResetAt: new Date()
    },
    lastDailyReset: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await usersCollection.insertOne(user);
  return { ...user, _id: result.insertedId };
}

export async function findUserByUsername(username: string): Promise<User | null> {
  if (!usersCollection) throw new Error('Database not initialized');

  const user = await usersCollection.findOne({ username });
  return user as User | null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (!usersCollection) throw new Error('Database not initialized');

  const user = await usersCollection.findOne({ id });
  return user as User | null;
}

export async function getUserWithWorkoutHistory(id: string): Promise<User | null> {
  if (!usersCollection) throw new Error('Database not initialized');

  const user = await usersCollection.findOne({ id });
  if (!user) return null;

  // Ensure workoutHistory exists
  if (!(user as any).workoutHistory) {
    (user as any).workoutHistory = [];
  }

  // Ensure userPlans exists
  if (!(user as any).userPlans || (user as any).userPlans.length === 0) {
    (user as any).userPlans = createDefaultPlans();
    // Update user in database with default plans
    await usersCollection.updateOne(
      { id },
      { $set: { userPlans: (user as any).userPlans, updatedAt: new Date() } }
    );
  } else {
    // Debug: Log current userPlans state
    console.log('🔍 Current userPlans from DB:', JSON.stringify((user as any).userPlans.map((plan: any) => ({
      name: plan.name,
      exercises: plan.exercises.map((ex: any) => ({
        name: ex.name,
        completed: ex.completed,
        completedReps: ex.completedReps,
        targetReps: ex.targetReps
      }))
    })), null, 2));
  }

  return user as User;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  await usersCollection.updateOne(
    { id },
    {
      $set: {
        ...updates,
        updatedAt: new Date()
      }
    }
  );
}

export async function updateUserLastLogin(id: string): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  await usersCollection.updateOne(
    { id },
    {
      $set: {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
}

export async function getAllUsers(): Promise<User[]> {
  if (!usersCollection) throw new Error('Database not initialized');

  const users = await usersCollection.find({}).toArray();
  return users as User[];
}

export async function deleteUser(id: string): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  await usersCollection.deleteOne({ id });
}

// Legacy functions for compatibility (will be removed)
export async function readUsers(): Promise<User[]> {
  return getAllUsers();
}

export async function writeUsers(users: User[]): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  // This is dangerous in production - only for migration
  await usersCollection.deleteMany({});
  if (users.length > 0) {
    await usersCollection.insertMany(users);
  }
}

// User plan management
export async function addUserPlan(userId: string, plan: Omit<UserPlan, 'createdAt'>): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  const newPlan: UserPlan = {
    ...plan,
    createdAt: new Date(),
  };

  await usersCollection.updateOne(
    { id: userId },
    {
      $push: { userPlans: newPlan },
      $set: { updatedAt: new Date() }
    } as any
  );
}

export async function updateUserPlan(userId: string, planId: string, updates: Partial<UserPlan>): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  await usersCollection.updateOne(
    { id: userId, "userPlans.id": planId },
    {
      $set: {
        "userPlans.$": { ...updates, id: planId },
        updatedAt: new Date()
      }
    }
  );
}

export async function deleteUserPlan(userId: string, planId: string): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  await usersCollection.updateOne(
    { id: userId },
    {
      $pull: { userPlans: { id: planId } },
      $set: { updatedAt: new Date() }
    } as any
  );
}

export async function setCurrentPlan(userId: string, planId: string): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: {
        currentPlanId: planId,
        updatedAt: new Date()
      }
    }
  );
}

// Check if user needs daily reset (4 AM local time)
export function needsDailyReset(lastReset?: Date): boolean {
  if (!lastReset) return true;

  const now = new Date();
  const today4AM = new Date(now);
  today4AM.setHours(4, 0, 0, 0);

  // If current time is before 4 AM, check against yesterday's 4 AM
  if (now.getHours() < 4) {
    today4AM.setDate(today4AM.getDate() - 1);
  }

  // Production code: reset at 4 AM daily
  return lastReset < today4AM;
}

// Get today's date key (considering 4 AM reset)
export function getTodayKey(): string {
  const now = new Date();
  const today = new Date(now);

  // If before 4 AM, consider it as previous day
  if (now.getHours() < 4) {
    today.setDate(today.getDate() - 1);
  }

  return today.toISOString().slice(0, 10);
}

// Reset daily exercises for a user
export async function resetDailyExercises(userId: string): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  const user = await findUserById(userId);
  if (!user) return;

  // Initialize userPlans if it doesn't exist
  if (!user.userPlans || user.userPlans.length === 0) {
    user.userPlans = createDefaultPlans();
  }

  // Reset all exercises in all plans to not completed
  const resetPlans = user.userPlans.map(plan => ({
    ...plan,
    exercises: plan.exercises.map(exercise => ({
      ...exercise,
      completedReps: 0,
      completed: false
    }))
  }));

  // Initialize today's stats
  const todayKey = getTodayKey();
  const dailyStats: DailyStats = {
    date: todayKey,
    calories: 0,
    exercisesCompleted: 0,
    workoutsCount: 0,
    lastResetAt: new Date()
  };

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: {
        userPlans: resetPlans,
        dailyStats,
        lastDailyReset: new Date(),
        updatedAt: new Date()
      }
    }
  );

  console.log(`✅ Daily exercises reset for user ${userId}`);
}

// Update daily stats
export async function updateDailyStats(userId: string, calories: number, exercisesCompleted: number): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  const todayKey = getTodayKey();
  const user = await findUserById(userId);
  if (!user) return;

  // Initialize dailyStats if it doesn't exist or is for a different date
  let dailyStats = (user as any).dailyStats;
  if (!dailyStats || dailyStats.date !== todayKey) {
    dailyStats = {
      date: todayKey,
      calories: 0,
      exercisesCompleted: 0,
      workoutsCount: 0,
      lastResetAt: new Date()
    };
  }

  // Update stats
  dailyStats.calories += calories;
  dailyStats.exercisesCompleted += exercisesCompleted;
  dailyStats.workoutsCount += 1;
  dailyStats.lastResetAt = new Date();

  // Update daily history
  let dailyHistory = (user as any).dailyHistory || [];
  const existingDayIndex = dailyHistory.findIndex((day: any) => day.date === todayKey);

  if (existingDayIndex >= 0) {
    // Update existing day
    dailyHistory[existingDayIndex].calories += calories;
    dailyHistory[existingDayIndex].exercisesCompleted += exercisesCompleted;
  } else {
    // Add new day
    dailyHistory.push({
      date: todayKey,
      calories: calories,
      exercisesCompleted: exercisesCompleted
    });
  }

  console.log(`📊 Updating daily stats for user ${userId}: +${calories} calories, +${exercisesCompleted} exercises`);

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: {
        dailyStats: dailyStats,
        dailyHistory: dailyHistory,
        updatedAt: new Date()
      }
    }
  );
}

// Mark exercise as completed
export async function markExerciseCompleted(userId: string, planId: string, exerciseId: string, reps: number): Promise<void> {
  if (!usersCollection) throw new Error('Database not initialized');

  // Find the user and update the specific exercise
  const user = await findUserById(userId);
  if (!user) return;

  // Ensure userPlans exists
  if (!user.userPlans || user.userPlans.length === 0) {
    user.userPlans = createDefaultPlans();
  }

  const updatedPlans = user.userPlans.map(plan => {
    if (plan.id !== planId) return plan;

    return {
      ...plan,
      exercises: plan.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        const newCompletedReps = exercise.completedReps + reps;
        return {
          ...exercise,
          completedReps: newCompletedReps,
          completed: newCompletedReps >= exercise.targetReps
        };
      })
    };
  });

  console.log(`✅ Marking exercise ${exerciseId} as completed for user ${userId}`);

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: {
        userPlans: updatedPlans,
        updatedAt: new Date()
      }
    }
  );
}

// Check and reset daily exercises if needed
export async function checkAndResetDailyExercises(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) return false;

  if (needsDailyReset(user.lastDailyReset)) {
    await resetDailyExercises(userId);
    return true;
  }

  return false;
}