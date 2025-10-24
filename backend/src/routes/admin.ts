import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcrypt";
import { z } from "zod";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const ADMIN_DATA_PATH = path.join(__dirname, "..", "data", "admin.json");
const SALT_ROUNDS = 12; // Increased from 10 to 12 for better security

// Enhanced password validation
const adminPasswordValidation = z.string()
  .min(8, "Admin password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Admin password must contain: lowercase, uppercase, number, and special character (@$!%*?&)");

interface AdminConfig {
  passwordHash: string;
  lastUpdated: string;
  lastLoginAt?: string;
  loginAttempts?: number;
  passwordStrength?: number;
  // Global feature toggles
  globalMuscleBoostEnabled?: boolean;
}

// Validation schemas
const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required").max(128),
});

const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: adminPasswordValidation,
});

// Schema for updating global settings
const updateGlobalSettingsSchema = z.object({
  globalMuscleBoostEnabled: z.boolean().optional(),
});

async function readAdminConfig(): Promise<AdminConfig> {
  try {
    const txt = await fs.readFile(ADMIN_DATA_PATH, "utf-8");
    return JSON.parse(txt) as AdminConfig;
  } catch {
    // If file doesn't exist, create default config with enhanced password
    const defaultPassword = "Lakodros01!";
    const defaultConfig: AdminConfig = {
      passwordHash: await bcrypt.hash(defaultPassword, SALT_ROUNDS),
      lastUpdated: new Date().toISOString(),
      passwordStrength: 8, // Max strength for default
      globalMuscleBoostEnabled: false, // Default to disabled
    };
    await writeAdminConfig(defaultConfig);
    return defaultConfig;
  }
}

async function writeAdminConfig(config: AdminConfig): Promise<void> {
  await fs.mkdir(path.dirname(ADMIN_DATA_PATH), { recursive: true });
  await fs.writeFile(ADMIN_DATA_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// POST /api/admin/login - Verify admin password with enhanced security
router.post("/admin/login", async (req, res) => {
  try {
    const validated = adminLoginSchema.parse(req.body);
    const adminConfig = await readAdminConfig();
    
    // Add timing attack protection
    const delay = Math.floor(Math.random() * 100) + 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const isValid = await bcrypt.compare(validated.password, adminConfig.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid admin password" });
    }
    
    // Update last login time
    const updatedConfig = {
      ...adminConfig,
      lastLoginAt: new Date().toISOString()
    };
    await writeAdminConfig(updatedConfig);
    
    res.json({ 
      success: true, 
      message: "Admin authenticated successfully",
      lastLogin: adminConfig.lastLoginAt,
      globalMuscleBoostEnabled: adminConfig.globalMuscleBoostEnabled ?? false
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Admin login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/change-password - Change admin password with enhanced validation
router.post("/admin/change-password", async (req, res) => {
  try {
    const validated = adminChangePasswordSchema.parse(req.body);
    const adminConfig = await readAdminConfig();
    
    // Verify current password
    const isCurrentValid = await bcrypt.compare(validated.currentPassword, adminConfig.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(validated.newPassword, adminConfig.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }
    
    // Calculate password strength (admin passwords should be very strong)
    const calculateStrength = (password: string): number => {
      let score = 0;
      if (password.length >= 8) score += 2;
      if (password.length >= 12) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[@$!%*?&]/.test(password)) score += 1;
      if (!/(..).*\1/.test(password)) score += 1;
      return score;
    };
    
    const passwordStrength = calculateStrength(validated.newPassword);
    
    // Hash new password and save
    const newPasswordHash = await bcrypt.hash(validated.newPassword, SALT_ROUNDS);
    const newConfig: AdminConfig = {
      passwordHash: newPasswordHash,
      lastUpdated: new Date().toISOString(),
      lastLoginAt: adminConfig.lastLoginAt,
      passwordStrength,
      globalMuscleBoostEnabled: adminConfig.globalMuscleBoostEnabled ?? false
    };
    
    await writeAdminConfig(newConfig);
    
    res.json({ 
      success: true, 
      message: "Admin password changed successfully",
      passwordStrength: {
        score: passwordStrength,
        level: passwordStrength >= 7 ? 'Very Strong' : passwordStrength >= 5 ? 'Strong' : 'Medium'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0].message,
        field: error.errors[0].path[0]
      });
    }
    console.error('Admin password change error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/global-settings - Update global settings
router.post("/admin/global-settings", async (req, res) => {
  try {
    const validated = updateGlobalSettingsSchema.parse(req.body);
    const adminConfig = await readAdminConfig();
    
    // Update the settings
    const updatedConfig: AdminConfig = {
      ...adminConfig,
      ...validated
    };
    
    await writeAdminConfig(updatedConfig);
    
    res.json({ 
      success: true, 
      message: "Global settings updated successfully",
      globalMuscleBoostEnabled: updatedConfig.globalMuscleBoostEnabled
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Admin global settings update error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/info - Get admin info with security details
router.get("/admin/info", async (req, res) => {
  try {
    const adminConfig = await readAdminConfig();
    
    res.json({ 
      lastUpdated: adminConfig.lastUpdated,
      lastLoginAt: adminConfig.lastLoginAt,
      hasPassword: !!adminConfig.passwordHash,
      passwordStrength: adminConfig.passwordStrength || 0,
      globalMuscleBoostEnabled: adminConfig.globalMuscleBoostEnabled ?? false,
      securityScore: {
        passwordAge: adminConfig.lastUpdated ? 
          Math.floor((Date.now() - new Date(adminConfig.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)) : null,
        recentLogin: adminConfig.lastLoginAt ? 
          Math.floor((Date.now() - new Date(adminConfig.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)) < 7 : false
      }
    });
  } catch (error) {
    console.error('Admin info error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as adminRouter };