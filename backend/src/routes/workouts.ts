import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../services/auth';
import {
    findUserById,
    updateUser,
    WorkoutHistoryEntry,
    checkAndResetDailyExercises,
    markExerciseCompleted,
    updateDailyStats,
    getTodayKey
} from '../services/database';

export const workoutRouter = Router();

// Workout completion schema
const workoutCompletionSchema = z.object({
    exercises: z.array(z.object({
        id: z.string(),
        name: z.string(),
        targetReps: z.number(),
        completedReps: z.number(),
        caloriesBurned: z.number().optional(),
    })),
    totalCalories: z.number().optional(),
    duration: z.number().optional(), // in seconds
    planId: z.string().optional(),
});

// Workout history entry interface is now imported from database service

// Complete workout endpoint
workoutRouter.post('/workouts/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Validate input
        const workoutData = workoutCompletionSchema.parse(req.body);

        // Check and reset daily exercises if needed (4 AM reset)
        const wasReset = await checkAndResetDailyExercises(req.user.id);
        if (wasReset) {
            console.log(`🔄 Daily exercises reset for user ${req.user.id}`);
        }

        // Get current user data (after potential reset)
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if exercise is already completed
        const exercise = workoutData.exercises[0]; // Assuming single exercise completion
        if (exercise && workoutData.planId) {
            const userPlan = user.userPlans.find(p => p.id === workoutData.planId);
            const userExercise = userPlan?.exercises.find(e => e.id === exercise.id);

            if (userExercise?.completed) {
                return res.status(400).json({
                    error: 'Exercise already completed for today',
                    message: 'You have already completed this exercise today. Try again tomorrow at 4 AM!'
                });
            }
        }

        // Calculate total calories if not provided
        const totalCalories = workoutData.totalCalories ||
            workoutData.exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);

        // Create workout history entry
        const workoutEntry: WorkoutHistoryEntry = {
            id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString(),
            exercises: workoutData.exercises as any,
            totalCalories,
            duration: workoutData.duration,
            planId: workoutData.planId,
        };

        // Get existing workout history or initialize empty array
        const workoutHistory = (user as any).workoutHistory || [];
        workoutHistory.push(workoutEntry);

        // Calculate coins earned (1 coin per 10 calories burned, minimum 5 coins)
        const coinsEarned = Math.max(5, Math.floor(totalCalories / 10));

        // Update streak logic
        const today = new Date().toDateString();
        const lastWorkoutDate = workoutHistory.length > 1 ?
            new Date(workoutHistory[workoutHistory.length - 2].date).toDateString() : null;

        let newStreak = user.streak || 0;
        if (lastWorkoutDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastWorkoutDate === yesterday.toDateString()) {
                // Consecutive day - increase streak
                newStreak += 1;
            } else if (lastWorkoutDate !== today) {
                // Gap in workouts - reset streak
                newStreak = 1;
            }
            // If lastWorkoutDate === today, keep current streak (same day workout)
        } else {
            // First workout
            newStreak = 1;
        }

        // Mark exercises as completed and update daily stats
        for (const ex of workoutData.exercises) {
            if (workoutData.planId) {
                await markExerciseCompleted(req.user.id, workoutData.planId, ex.id, ex.completedReps);
            }
        }

        // Update daily stats
        await updateDailyStats(req.user.id, totalCalories, workoutData.exercises.reduce((sum, ex) => sum + ex.completedReps, 0));

        // Update user data
        const updates = {
            workoutHistory,
            coins: (user.coins || 0) + coinsEarned,
            streak: newStreak,
            totalWorkouts: (user.totalWorkouts || 0) + 1,
            lastWorkoutDate: new Date().toISOString(),
        };

        await updateUser(req.user.id, updates);

        // Get updated user data
        const updatedUser = await findUserById(req.user.id);

        res.json({
            message: 'Workout completed successfully',
            workoutId: workoutEntry.id,
            coinsEarned,
            totalCalories,
            streak: newStreak,
            exercises: workoutData.exercises,
            user: updatedUser ? {
                id: updatedUser.id,
                username: updatedUser.username,
                coins: updatedUser.coins,
                streak: updatedUser.streak,
                totalWorkouts: updatedUser.totalWorkouts,
            } : null,
        });
    } catch (error) {
        console.error('Complete workout error:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors,
            });
        }

        res.status(500).json({ error: 'Failed to complete workout' });
    }
});

// Get workout history endpoint
workoutRouter.get('/workouts/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const workoutHistory = (user as any).workoutHistory || [];

        // Sort by date (newest first)
        const sortedHistory = workoutHistory.sort((a: WorkoutHistoryEntry, b: WorkoutHistoryEntry) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        res.json({
            history: sortedHistory,
            totalWorkouts: user.totalWorkouts || 0,
            totalCalories: workoutHistory.reduce((sum: number, workout: WorkoutHistoryEntry) =>
                sum + workout.totalCalories, 0),
        });
    } catch (error) {
        console.error('Get workout history error:', error);
        res.status(500).json({ error: 'Failed to get workout history' });
    }
});

// Get today's workout stats
workoutRouter.get('/workouts/today', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check and reset daily exercises if needed
        await checkAndResetDailyExercises(req.user.id);

        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get today's stats from dailyStats field
        const dailyStats = (user as any).dailyStats;
        const todayKey = getTodayKey();

        let todayStats;
        if (dailyStats && dailyStats.date === todayKey) {
            // Use stored daily stats
            todayStats = {
                workoutsCompleted: dailyStats.workoutsCount || 0,
                totalCalories: dailyStats.calories || 0,
                totalExercises: dailyStats.exercisesCompleted || 0,
                totalDuration: 0, // We can add this to dailyStats if needed
            };
        } else {
            // Fallback to calculating from workout history
            const workoutHistory = (user as any).workoutHistory || [];
            const today = new Date().toDateString();

            const todayWorkouts = workoutHistory.filter((workout: WorkoutHistoryEntry) =>
                new Date(workout.date).toDateString() === today
            );

            todayStats = {
                workoutsCompleted: todayWorkouts.length,
                totalCalories: todayWorkouts.reduce((sum: number, workout: WorkoutHistoryEntry) =>
                    sum + workout.totalCalories, 0),
                totalExercises: todayWorkouts.reduce((sum: number, workout: WorkoutHistoryEntry) =>
                    sum + workout.exercises.reduce((exSum: number, ex: any) => exSum + ex.completedReps, 0), 0),
                totalDuration: todayWorkouts.reduce((sum: number, workout: WorkoutHistoryEntry) =>
                    sum + (workout.duration || 0), 0),
            };
        }

        res.json({ todayStats });
    } catch (error) {
        console.error('Get today stats error:', error);
        res.status(500).json({ error: 'Failed to get today stats' });
    }
});

// Delete workout from history
workoutRouter.delete('/workouts/:workoutId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { workoutId } = req.params;
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const workoutHistory = (user as any).workoutHistory || [];
        const workoutIndex = workoutHistory.findIndex((w: WorkoutHistoryEntry) => w.id === workoutId);

        if (workoutIndex === -1) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // Remove workout from history
        const removedWorkout = workoutHistory.splice(workoutIndex, 1)[0];

        // Update user data (subtract coins and adjust totals)
        const coinsToSubtract = Math.max(5, Math.floor(removedWorkout.totalCalories / 10));
        const updates = {
            workoutHistory,
            coins: Math.max(0, (user.coins || 0) - coinsToSubtract),
            totalWorkouts: Math.max(0, (user.totalWorkouts || 0) - 1),
        };

        await updateUser(req.user.id, updates);

        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('Delete workout error:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});