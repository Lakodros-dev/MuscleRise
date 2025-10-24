import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { findUserByUsername, findUserById, createUser, updateUserLastLogin, User } from './database';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const BCRYPT_ROUNDS = 10;

// JWT payload interface
export interface JWTPayload {
    userId: string;
    username: string;
    iat?: number;
    exp?: number;
}

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
    user?: User;
    params: any;
    body: any;
    headers: any;
}

// Generate JWT token
export function generateToken(user: User): string {
    const payload: JWTPayload = {
        userId: user.id,
        username: user.username,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Register new user
export async function registerUser(userData: {
    username: string;
    password: string;
    weightKg: number;
    heightCm: number;
    avatarUrl?: string;
    planId: string;
    customExercises?: any[];
}): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await findUserByUsername(userData.username);
    if (existingUser) {
        throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user
    const user = await createUser({
        id: userId,
        username: userData.username,
        passwordHash,
        weightKg: userData.weightKg,
        heightCm: userData.heightCm,
        avatarUrl: userData.avatarUrl || '',
        currentPlanId: userData.planId,
        coins: 0,
        streak: 0,
        totalWorkouts: 0,
    });

    // Generate token
    const token = generateToken(user);

    // If user has custom exercises, create custom plan
    if (userData.customExercises && userData.customExercises.length > 0) {
        const { addUserPlan, setCurrentPlan } = await import('./database');

        const customPlanId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await addUserPlan(user.id, {
            id: customPlanId,
            name: 'My Custom Plan',
            exercises: userData.customExercises.map((ex: any) => ({
                id: ex.id || ex.name.toLowerCase().replace(/\s+/g, '-'),
                name: ex.name,
                caloriesPerRep: 0.5, // Default value
                targetReps: ex.qty || ex.reps || 10,
                completedReps: 0,
            })),
            isCustom: true,
        });

        // Set custom plan as current
        await setCurrentPlan(user.id, customPlanId);
    }

    // Update last login
    await updateUserLastLogin(user.id);

    return { user, token };
}

// Login user
export async function loginUser(username: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const user = await findUserByUsername(username);
    if (!user) {
        throw new Error('Invalid username or password');
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Invalid username or password');
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    await updateUserLastLogin(user.id);

    return { user, token };
}

// Middleware to authenticate requests
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        console.log('🔐 Auth middleware - Header:', authHeader ? 'Present' : 'Missing');
        console.log('🔐 Auth middleware - Token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token
        const payload = verifyToken(token);
        console.log('✅ Token verified for user:', payload.userId);

        // Get user from database
        const user = await findUserById(payload.userId);
        if (!user) {
            console.log('❌ User not found in database:', payload.userId);
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('✅ User authenticated:', user.username);
        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.log('❌ Auth error:', error instanceof Error ? error.message : error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const payload = verifyToken(token);
            const user = await findUserById(payload.userId);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
}

// Refresh token
export async function refreshToken(oldToken: string): Promise<{ user: User; token: string }> {
    try {
        // Verify old token (even if expired, we can still decode it)
        const payload = jwt.decode(oldToken) as JWTPayload;
        if (!payload || !payload.userId) {
            throw new Error('Invalid token');
        }

        // Get user from database
        const user = await findUserById(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate new token
        const newToken = generateToken(user);

        return { user, token: newToken };
    } catch (error) {
        throw new Error('Token refresh failed');
    }
}