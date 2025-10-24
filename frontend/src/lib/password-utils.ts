/**
 * Password Strength Utility for MuscleRise Frontend
 * Matches the server-side password validation logic
 */

export interface PasswordStrength {
  score: number;
  maxScore: number;
  level: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  feedback: string[];
  isAcceptable: boolean;
  color: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Use at least 8 characters");
  }
  
  if (password.length >= 12) {
    score += 1;
  } else {
    feedback.push("Consider using 12+ characters for better security");
  }
  
  // Character variety
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add lowercase letters");
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add uppercase letters");
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add numbers");
  }
  
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add special characters (@$!%*?&)");
  }
  
  // Pattern checking
  if (!/(..).*\1/.test(password)) {
    score += 1;
  } else {
    feedback.push("Avoid repeating patterns");
  }
  
  // Common password check (basic)
  const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein'];
  if (!commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score += 1;
  } else {
    feedback.push("Avoid common password patterns");
  }
  
  // Determine level and color
  let level: PasswordStrength['level'] = 'Very Weak';
  let color = '#ef4444'; // red
  
  if (score >= 7) {
    level = 'Very Strong';
    color = '#10b981'; // emerald
  } else if (score >= 6) {
    level = 'Strong';
    color = '#06b6d4'; // cyan
  } else if (score >= 4) {
    level = 'Medium';
    color = '#f59e0b'; // amber
  } else if (score >= 2) {
    level = 'Weak';
    color = '#f97316'; // orange
  }
  
  return {
    score,
    maxScore: 8,
    level,
    feedback,
    isAcceptable: score >= 6,
    color
  };
}

export function validatePasswordRules(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  
  if (password.length > 128) {
    errors.push("Password is too long (max 128 characters)");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letters");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letters");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain numbers");
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain special characters (@$!%*?&)");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generatePasswordSuggestion(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '@$!%*?&';
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining length with random characters
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Hook for React components
export function usePasswordStrength(password: string) {
  const strength = calculatePasswordStrength(password);
  const validation = validatePasswordRules(password);
  
  return {
    strength,
    validation,
    isStrong: strength.isAcceptable,
    isValid: validation.isValid,
    suggestions: strength.feedback
  };
}