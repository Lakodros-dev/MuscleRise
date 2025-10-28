import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, authenticateToken, refreshToken, AuthenticatedRequest } from '../services/auth';
import { updateUser, findUserById, User } from '../services/database';

export const authRouter = Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6).max(100),
  weightKg: z.number().min(30).max(300),
  heightCm: z.number().min(100).max(250),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  planId: z.string(),
  customExercises: z.array(z.any()).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  weightKg: z.number().min(30).max(300).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  planId: z.string().optional(),
  currentPlanId: z.string().optional(),
  customExercises: z.array(z.any()).optional(),
  customPlanName: z.string().optional(),
  selectedExercises: z.array(z.object({
    exerciseName: z.string(),
    category: z.string(),
    reps: z.number(),
    dateAdded: z.string(),
    timesUsed: z.number(),
    lastUsed: z.string(),
  })).optional(),
  coins: z.number().min(0).optional(),
  streak: z.number().min(0).optional(),
  totalWorkouts: z.number().min(0).optional(),
  // Theme settings
  customPrimaryColor: z.string().optional(),
  themeSkin: z.string().optional(),
  themeUnlockedSkins: z.array(z.string()).optional(),
  themeOutfitsUnlocked: z.array(z.string()).optional(),
  themePrimaryChoicesOwned: z.array(z.string()).optional(),
  themeWhiteThemeEnabled: z.boolean().optional(),
  themeMuscleBoostEnabled: z.boolean().optional(),
});

// Register endpoint
authRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const { user, token } = await registerUser(validatedData as any);

    // Remove sensitive data from response
    const { passwordHash, ...userResponse } = user;

    // Set HTTP-only cookie for token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token, // Also send in response for frontend storage
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
authRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const { username, password } = loginSchema.parse(req.body);

    // Login user
    const { user, token } = await loginUser(username, password);

    // Remove sensitive data from response
    const { passwordHash, ...userResponse } = user;

    // Set HTTP-only cookie for token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user: userResponse,
      token, // Also send in response for frontend storage
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid username or password')) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
authRouter.post('/auth/logout', (req: Request, res: Response) => {
  // Clear the auth cookie
  res.clearCookie('auth_token');
  res.json({ message: 'Logout successful' });
});

// Get current user (protected route)
authRouter.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check and reset daily exercises if needed (4 AM reset)
    const { checkAndResetDailyExercises, getUserWithWorkoutHistory } = await import('../services/database');
    const wasReset = await checkAndResetDailyExercises(req.user.id);
    if (wasReset) {
      console.log(`🔄 Daily exercises reset for user ${req.user.id} on login`);
    }

    // Get fresh user data from database with workout history
    const user = await getUserWithWorkoutHistory(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update user (protected route)
authRouter.patch('/auth/user/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is updating their own data
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }

    // Validate input
    const updates = updateUserSchema.parse(req.body);

    // If custom exercises are being updated, also update currentPlanId
    if (updates.customExercises && updates.customExercises.length > 0) {
      updates.currentPlanId = "custom-plan";
      console.log('🎯 Setting currentPlanId to custom-plan due to custom exercises');
    }

    // Update user in database
    await updateUser(id, updates as any);

    // Get updated user data
    const updatedUser = await findUserById(id);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, ...userResponse } = updatedUser;

    res.json({
      message: 'User updated successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Refresh token endpoint
authRouter.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { token: oldToken } = req.body;

    if (!oldToken) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Refresh token
    const { user, token: newToken } = await refreshToken(oldToken);

    // Remove sensitive data
    const { passwordHash, ...userResponse } = user;

    // Set new HTTP-only cookie
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Token refreshed successfully',
      user: userResponse,
      token: newToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Get all users for leaderboard (public endpoint)
authRouter.get('/auth/users', async (req: Request, res: Response) => {
  try {
    const { getAllUsers } = await import('../services/database');
    const users = await getAllUsers();

    // Remove sensitive data and format for leaderboard
    const leaderboardUsers = users.map(user => {
      // Calculate total exercises from daily history
      let totalExercises = 0;
      if (user.dailyHistory && Array.isArray(user.dailyHistory)) {
        totalExercises = user.dailyHistory.reduce((sum, day) => sum + (day.exercisesCompleted || 0), 0);
      }

      // If no daily history, use stored totalExercises or fallback to demo data
      if (totalExercises === 0) {
        totalExercises = user.totalExercises || Math.floor(Math.random() * 100) + 10; // Demo: 10-110 exercises
      }

      return {
        id: user.id,
        username: user.username,
        name: user.username, // Use username as display name
        coins: user.coins || 0,
        todayCalories: 0, // TODO: Calculate from today's activities
        todayExercises: 0, // TODO: Calculate from today's activities
        totalExercises: totalExercises,
        avatarUrl: user.avatarUrl || '',
        totalWorkouts: user.totalWorkouts || 0,
        streak: user.streak || 0,
      };
    });

    res.json({ users: leaderboardUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user rank (protected route)
authRouter.get('/auth/user/:id/rank', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own rank or is admin
    if (!req.user || (req.user.id !== id)) {
      return res.status(403).json({ error: 'Unauthorized to view this rank' });
    }

    const { getAllUsers } = await import('../services/database');
    const users = await getAllUsers();

    console.log(`🔍 Calculating rank for user ${id}, total users: ${users.length}`);

    // Sort users by coins (descending)
    const sortedUsers = users
      .map(user => ({
        id: user.id,
        username: user.username,
        coins: user.coins || 0,
        totalWorkouts: user.totalWorkouts || 0,
      }))
      .sort((a, b) => b.coins - a.coins);

    console.log('📊 Sorted users by coins:', sortedUsers.map(u => `${u.username}: ${u.coins} coins`));

    // Find user's position
    const userPosition = sortedUsers.findIndex(user => user.id === id) + 1;
    const totalUsers = sortedUsers.length;

    const rank = {
      position: userPosition > 0 ? userPosition : totalUsers,
      total: totalUsers,
    };

    console.log(`✅ User rank calculated: #${rank.position} out of ${rank.total}`);
    res.json({ rank });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ error: 'Failed to get user rank' });
  }
});

// Add custom plan (protected route)
authRouter.post('/auth/user/:id/plans', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is updating their own plans
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized to update plans for this user' });
    }

    const planSchema = z.object({
      name: z.string().min(1).max(50),
      exercises: z.array(z.object({
        id: z.string(),
        name: z.string(),
        caloriesPerRep: z.number().min(0),
        targetReps: z.number().min(1),
        completedReps: z.number().min(0).default(0),
      })).min(1).max(10),
    });

    const { name, exercises } = planSchema.parse(req.body);

    const { addUserPlan, setCurrentPlan } = await import('../services/database');

    // Generate unique plan ID
    const planId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add custom plan to user
    await addUserPlan(id, {
      id: planId,
      name,
      exercises: exercises as any,
      isCustom: true,
    });

    // Set as current plan
    await setCurrentPlan(id, planId);

    res.json({
      message: 'Custom plan created successfully',
      planId,
    });
  } catch (error) {
    console.error('Create custom plan error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({ error: 'Failed to create custom plan' });
  }
});

// Get user exercises/stats (protected route)
authRouter.get('/auth/user/:id/exercises', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own data
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized to view exercises for this user' });
    }

    // Get user data
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate exercise statistics
    const selectedExercises = (user as any).selectedExercises || [];
    const totalExercises = selectedExercises.length;
    const totalUsage = selectedExercises.reduce((sum: number, ex: any) => sum + (ex.timesUsed || 0), 0);

    // Find most used exercise
    const mostUsedExercise = selectedExercises.length > 0
      ? selectedExercises.reduce((max: any, ex: any) =>
        (ex.timesUsed || 0) > (max.timesUsed || 0) ? ex : max
      )
      : null;

    // Get recent exercises (last 5)
    const recentExercises = selectedExercises
      .filter((ex: any) => ex.lastUsed)
      .sort((a: any, b: any) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 5);

    const stats = {
      totalExercises,
      totalUsage,
      mostUsedExercise,
      recentExercises,
      selectedExercises
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user exercises error:', error);
    res.status(500).json({ error: 'Failed to get user exercises' });
  }
});

// Get user by ID (protected route)
authRouter.get('/auth/user/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own data
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized to view this user' });
    }

    // Get user data
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Get user statistics (protected route)
authRouter.get('/auth/user/:id/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get user data
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate statistics from user data
    const totalWorkouts = user.totalWorkouts || 0;
    const totalExercises = user.totalExercises || 0;
    const totalCalories = user.totalCalories || 0;
    const streak = user.streak || 0;

    // Calculate average calories per day (assuming user has been active for at least 1 day)
    const averageCaloriesPerDay = totalWorkouts > 0 ? Math.round(totalCalories / Math.max(totalWorkouts, 1)) : 0;

    // Get last workout date from daily history
    let lastWorkoutDate = 'N/A';
    if (user.dailyHistory && user.dailyHistory.length > 0) {
      const sortedHistory = user.dailyHistory
        .filter((entry: any) => entry.calories > 0 || entry.exercisesCompleted > 0)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (sortedHistory.length > 0) {
        lastWorkoutDate = new Date(sortedHistory[0].date).toLocaleDateString();
      }
    }

    const stats = {
      totalWorkouts,
      totalExercises,
      totalCalories,
      averageCaloriesPerDay,
      streak,
      lastWorkoutDate
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Set current plan (protected route)
authRouter.patch('/auth/user/:id/current-plan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is updating their own plan
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized to update plan for this user' });
    }

    const { planId } = z.object({
      planId: z.string(),
    }).parse(req.body);

    const { setCurrentPlan } = await import('../services/database');
    await setCurrentPlan(id, planId);

    res.json({
      message: 'Current plan updated successfully',
    });
  } catch (error) {
    console.error('Set current plan error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({ error: 'Failed to set current plan' });
  }
});