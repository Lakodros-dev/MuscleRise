import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { readUsers, writeUsers, updateUser } from "../services/database";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced password validation with security requirements
const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain: lowercase, uppercase, number, and special character (@$!%*?&)");

// Enhanced validation schemas
const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: passwordValidation,
  weightKg: z.number().min(30, "Weight must be at least 30kg").max(300, "Weight too high"),
  heightCm: z.number().min(100, "Height must be at least 100cm").max(250, "Height too high"),
  name: z.string().optional(),
  avatarUrl: z.union([z.string().url(), z.literal(""), z.undefined()]).optional(),
  planId: z.string().optional(),
  customExercises: z.array(z.any()).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(20),
  password: z.string().min(1, "Password is required").max(128),
});

// Change password schema with enhanced validation
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordValidation,
});

const updateUserSchema = z.object({
  coins: z.number().min(0).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  avatarUrl: z.union([z.string().url(), z.literal(""), z.undefined()]).optional(),
  customExercises: z.array(z.any()).optional(),
  todayCalories: z.number().min(0).optional(),
  todayExercises: z.number().min(0).optional(),
  name: z.string().optional(),
  planId: z.string().optional(),
  // Theme settings
  themeSkin: z.string().optional(),
  themeUnlockedSkins: z.array(z.string()).optional(),
  themeOutfitsUnlocked: z.array(z.string()).optional(),
  themePrimaryChoicesOwned: z.array(z.string()).optional(),
  themeWhiteThemeEnabled: z.boolean().optional(),
  themeMuscleBoostEnabled: z.boolean().optional(),
  customPrimaryColor: z.string().optional(),
  customPlanName: z.string().optional(),
  // Date-specific workout data mapping
  dateWorkoutDataMap: z.record(z.string(), z.object({
    planId: z.string(),
    plans: z.array(z.object({
      id: z.string(),
      name: z.string(),
      exercises: z.array(z.object({
        id: z.string(),
        name: z.string(),
        caloriesPerRep: z.number(),
        targetReps: z.number(),
        completedReps: z.number(),
      })),
    })),
  })).optional(),
  // Daily history
  dailyHistory: z.array(z.object({
    date: z.string(), // YYYY-MM-DD
    calories: z.number(),
    exercisesCompleted: z.number()
  })).optional(),
  // User exercise selections and preferences
  selectedExercises: z.array(z.object({
    exerciseName: z.string(),
    category: z.string(),
    reps: z.number(),
    dateAdded: z.string(), // ISO date string
    timesUsed: z.number().optional(),
    lastUsed: z.string().optional() // ISO date string
  })).optional(),
});

const router = Router();
const SALT_ROUNDS = 12; // Increased from 10 to 12 for better security

// Rate limiting storage for brute force protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window

// Password strength scoring
function calculatePasswordStrength(password: string): { score: number; feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");
  
  if (password.length >= 12) score += 1;
  else feedback.push("Consider using 12+ characters for better security");
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Add lowercase letters");
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Add uppercase letters");
  
  if (/\d/.test(password)) score += 1;
  else feedback.push("Add numbers");
  
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push("Add special characters (@$!%*?&)");
  
  // Pattern checking
  if (!/(..).*\1/.test(password)) score += 1;
  else feedback.push("Avoid repeating patterns");
  
  // Common password check (basic)
  const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein'];
  if (!commonPasswords.some(common => password.toLowerCase().includes(common))) score += 1;
  else feedback.push("Avoid common password patterns");
  
  return { score, feedback };
}

// Rate limiting check
function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number; blockedUntil?: Date } {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }
  
  // Check if user is currently blocked
  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    return { 
      allowed: false, 
      blockedUntil: new Date(attempts.blockedUntil) 
    };
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }
  
  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.blockedUntil = now + LOCKOUT_DURATION;
    return { 
      allowed: false, 
      blockedUntil: new Date(attempts.blockedUntil) 
    };
  }
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.count 
  };
}

// Reset rate limit on successful login
function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

interface User {
  id: string;
  username: string;
  passwordHash: string;
  weightKg: number;
  heightCm: number;
  avatarUrl?: string | null;
  musclesLevel: number;
  coins: number;
  name?: string;
  customExercises?: any[];
  todayCalories?: number;
  todayExercises?: number;
  planId?: string;
  // Theme settings
  themeSkin?: string;
  themeUnlockedSkins?: string[];
  themeOutfitsUnlocked?: string[];
  themePrimaryChoicesOwned?: string[];
  themeWhiteThemeEnabled?: boolean;
  themeMuscleBoostEnabled?: boolean;
  // Primary color customization
  customPrimaryColor?: string;
  // Custom workout plan
  customPlanName?: string;
  // Daily history
  dailyHistory?: Array<{
    date: string; // YYYY-MM-DD
    calories: number;
    exercisesCompleted: number;
  }>;
  // Date-specific workout data mapping
  dateWorkoutDataMap?: Record<string, {
    planId: string;
    plans: Array<{
      id: string;
      name: string;
      exercises: Array<{
        id: string;
        name: string;
        caloriesPerRep: number;
        targetReps: number;
        completedReps: number;
      }>;
    }>;
  }>;
  // User exercise selections and preferences
  selectedExercises?: Array<{
    exerciseName: string;
    category: string;
    reps: number;
    dateAdded: string; // ISO date string
    timesUsed?: number;
    lastUsed?: string; // ISO date string
  }>;
  // Security tracking fields
  passwordChangedAt?: string; // ISO date string
  lastLoginAt?: string; // ISO date string
  loginAttempts?: number;
  accountLockedUntil?: string; // ISO date string
}

// Enhanced password hashing with timing attack protection
async function hashPassword(password: string): Promise<string> {
  // Add random delay to prevent timing attacks
  const delay = Math.floor(Math.random() * 100) + 50;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Enhanced password verification with timing attack protection
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Add random delay to prevent timing attacks
  const delay = Math.floor(Math.random() * 100) + 50;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Log error but don't expose details
    console.error('Password verification error:', error);
    return false;
  }
}

function sanitizeUser(user: User) {
  const safe: any = {
    id: user.id,
    username: user.username,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    avatarUrl: user.avatarUrl ?? null,
    musclesLevel: user.musclesLevel,
    coins: user.coins,
  };
  if (user.name) safe.name = user.name;
  if (user.customExercises) safe.customExercises = user.customExercises;
  if (user.todayCalories !== undefined) safe.todayCalories = user.todayCalories;
  if (user.todayExercises !== undefined) safe.todayExercises = user.todayExercises;
  if (user.planId) safe.planId = user.planId;
  // Include theme settings
  if (user.themeSkin) safe.themeSkin = user.themeSkin;
  if (user.themeUnlockedSkins) safe.themeUnlockedSkins = user.themeUnlockedSkins;
  if (user.themeOutfitsUnlocked) safe.themeOutfitsUnlocked = user.themeOutfitsUnlocked;
  if (user.themePrimaryChoicesOwned) safe.themePrimaryChoicesOwned = user.themePrimaryChoicesOwned;
  if (user.themeWhiteThemeEnabled !== undefined) safe.themeWhiteThemeEnabled = user.themeWhiteThemeEnabled;
  if (user.themeMuscleBoostEnabled !== undefined) safe.themeMuscleBoostEnabled = user.themeMuscleBoostEnabled;
  if (user.customPrimaryColor) safe.customPrimaryColor = user.customPrimaryColor;
  if (user.customPlanName) safe.customPlanName = user.customPlanName;
  // Include daily history
  if (user.dailyHistory) safe.dailyHistory = user.dailyHistory;
  // Include date-workout data mapping
  if (user.dateWorkoutDataMap) safe.dateWorkoutDataMap = user.dateWorkoutDataMap;
  // Include selected exercises
  if (user.selectedExercises) safe.selectedExercises = user.selectedExercises;
  // Include security info (last login, but not password change time for security)
  if (user.lastLoginAt) safe.lastLoginAt = user.lastLoginAt;
  return safe;
}

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    
    // Check password strength
    const passwordStrength = calculatePasswordStrength(validated.password);
    if (passwordStrength.score < 6) {
      return res.status(400).json({ 
        error: "Password is too weak",
        feedback: passwordStrength.feedback,
        score: passwordStrength.score,
        maxScore: 8
      });
    }
    
    const users = await readUsers();
    
    // Check username uniqueness (case-insensitive)
    if (users.find((u: User) => u.username.toLowerCase() === validated.username.toLowerCase())) {
      return res.status(409).json({ error: "Username already exists" });
    }
    
    const passwordHash = await hashPassword(validated.password);
    const user: User = {
      id: crypto.randomUUID(),
      username: validated.username,
      passwordHash,
      weightKg: validated.weightKg,
      heightCm: validated.heightCm,
      avatarUrl: validated.avatarUrl ?? null,
      musclesLevel: 1,
      coins: 0,
      name: validated.name,
      customExercises: validated.customExercises,
      planId: validated.planId,
      // Security tracking
      passwordChangedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    
    users.push(user);
    await writeUsers(users);
    
    res.status(201).json({ 
      user: sanitizeUser(user), 
      planId: validated.planId ?? null,
      message: "Account created successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0].message,
        field: error.errors[0].path[0]
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login - Enhanced with rate limiting
router.post("/auth/login", async (req, res) => {
  console.log('Login endpoint hit with:', req.body);
  try {
    const validated = loginSchema.parse(req.body);
    
    // Check rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const identifier = `${validated.username}:${clientIP}`;
    const rateCheck = checkRateLimit(identifier);
    
    if (!rateCheck.allowed) {
      const minutesRemaining = rateCheck.blockedUntil ? 
        Math.ceil((rateCheck.blockedUntil.getTime() - Date.now()) / (1000 * 60)) : 0;
      return res.status(429).json({ 
        error: "Too many login attempts",
        blockedUntil: rateCheck.blockedUntil,
        minutesRemaining
      });
    }
    
    const users = await readUsers();
    const user = users.find((u: User) => u.username.toLowerCase() === validated.username.toLowerCase());
    
    if (!user) {
      // Still verify a dummy password to prevent timing attacks
      await verifyPassword(validated.password, '$2b$12$dummy.hash.to.prevent.timing.attacks.dummy');
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const isValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ 
        error: "Invalid credentials",
        remainingAttempts: rateCheck.remainingAttempts
      });
    }
    
    // Successful login - reset rate limit and update last login
    resetRateLimit(identifier);
    
    // Update last login time
    const userIndex = users.findIndex((u: User) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].lastLoginAt = new Date().toISOString();
      await writeUsers(users);
    }
    
    res.json({ 
      user: sanitizeUser(users[userIndex]),
      message: "Login successful"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/change-password - Change user password
router.post("/auth/change-password", async (req, res) => {
  try {
    const validated = changePasswordSchema.parse(req.body);
    const { userId } = req.body; // Assuming userId is passed in request
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Check password strength
    const passwordStrength = calculatePasswordStrength(validated.newPassword);
    if (passwordStrength.score < 6) {
      return res.status(400).json({ 
        error: "New password is too weak",
        feedback: passwordStrength.feedback,
        score: passwordStrength.score,
        maxScore: 8
      });
    }
    
    const users = await readUsers();
    const userIndex = users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = users[userIndex];
    
    // Verify current password
    const isCurrentValid = await verifyPassword(validated.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    // Check if new password is different from current
    const isSamePassword = await verifyPassword(validated.newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }
    
    // Hash new password and update
    const newPasswordHash = await hashPassword(validated.newPassword);
    users[userIndex].passwordHash = newPasswordHash;
    users[userIndex].passwordChangedAt = new Date().toISOString();
    
    await writeUsers(users);
    
    res.json({ 
      success: true, 
      message: "Password changed successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0].message,
        field: error.errors[0].path[0]
      });
    }
    console.error('Password change error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/check-password-strength - Check password strength
router.post("/auth/check-password-strength", async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: "Password is required" });
    }
    
    const strength = calculatePasswordStrength(password);
    
    let level = 'Very Weak';
    if (strength.score >= 7) level = 'Very Strong';
    else if (strength.score >= 6) level = 'Strong';
    else if (strength.score >= 4) level = 'Medium';
    else if (strength.score >= 2) level = 'Weak';
    
    res.json({
      score: strength.score,
      maxScore: 8,
      level,
      feedback: strength.feedback,
      isAcceptable: strength.score >= 6
    });
  } catch (error) {
    console.error('Password strength check error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/security-info/:id - Get security info for user
router.get("/auth/security-info/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const users: User[] = await readUsers();
    const user: User | undefined = users.find((u: User) => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
      accountCreatedAt: user.passwordChangedAt, // Assuming first password change is account creation
      securityScore: {
        passwordAge: user.passwordChangedAt ? 
          Math.floor((Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24)) : null,
        recentLogin: user.lastLoginAt ? 
          Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)) < 30 : false
      }
    });
  } catch (error) {
    console.error('Security info error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/auth/users", async (_req, res) => {
  try {
    const users: User[] = await readUsers();
    // Return only necessary data for leaderboard (no sensitive info)
    const leaderboardUsers = users.map((user: User) => ({
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      coins: user.coins || 0,
      todayCalories: user.todayCalories || 0,
      todayExercises: user.todayExercises || 0,
      avatarUrl: user.avatarUrl
    }));
    
    res.json({ users: leaderboardUsers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/user/:id - get user data
router.get("/auth/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const users: User[] = await readUsers();
    const user: User | undefined = users.find((u: User) => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/user/:id/rank - get user's real ranking
router.get("/auth/user/:id/rank", async (req, res) => {
  try {
    const id = req.params.id;
    const users: User[] = await readUsers();
    const currentUser: User | undefined = users.find((u: User) => u.id === id);
    
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Calculate user rankings based on coins
    const sortedByCoins = users
      .map((user: User) => ({
        id: user.id,
        coins: user.coins || 0,
        todayCalories: user.todayCalories || 0,
        todayExercises: user.todayExercises || 0
      }))
      .sort((a: { coins: number }, b: { coins: number }) => b.coins - a.coins);
    
    // Find current user's position
    const userPosition = sortedByCoins.findIndex((user: { id: string }) => user.id === id) + 1;
    const totalUsers = users.length;
    
    res.json({ 
      rank: {
        position: userPosition,
        total: totalUsers
      },
      userStats: {
        coins: currentUser.coins || 0,
        todayCalories: currentUser.todayCalories || 0,
        todayExercises: currentUser.todayExercises || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/user/:id/exercises - get user's exercise preferences and statistics
router.get("/auth/user/:id/exercises", async (req, res) => {
  try {
    const id = req.params.id;
    const users: User[] = await readUsers();
    const user: User | undefined = users.find((u: User) => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const exercises: any[] = user.selectedExercises || [];
    
    // Calculate statistics
    const stats = {
      totalExercises: exercises.length,
      totalUsage: exercises.reduce((sum: number, ex: any) => sum + (ex.timesUsed || 0), 0),
      categoriesUsed: [...new Set(exercises.map((ex: any) => ex.category))].length,
      mostUsedExercise: exercises.reduce((prev: any, current: any) => 
        (prev.timesUsed || 0) > (current.timesUsed || 0) ? prev : current, 
        exercises[0] || null
      ),
      recentExercises: exercises
        .filter((ex: any) => ex.lastUsed)
        .sort((a: any, b: any) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
        .slice(0, 5),
      categoryBreakdown: exercises.reduce((acc: Record<string, number>, ex: any) => {
        acc[ex.category] = (acc[ex.category] || 0) + (ex.timesUsed || 0);
        return acc;
      }, {} as Record<string, number>)
    };
    
    res.json({ 
      exercises: exercises,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/auth/user/:id - update user fields
router.patch("/auth/user/:id", async (req, res) => {
  try {
    const validated = updateUserSchema.parse(req.body);
    const id = req.params.id;
    
    // Use the database service to update the user
    await updateUser(id, validated);
    
    // Get the updated user data
    const users: User[] = await readUsers();
    const user: User | undefined = users.find((u: User) => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as authRouter };
