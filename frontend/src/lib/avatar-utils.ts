export interface AvatarColors {
  primary: string;
  accent: string;
}

export interface AvatarDimensions {
  chest: number;
  armWidth: number;
}

export function getAvatarColors(skin: string): AvatarColors {
  const colors: Record<string, AvatarColors> = {
    default: { primary: "#10B981", accent: "#06B6D4" },
    "design-emerald": { primary: "#10B981", accent: "#06B6D4" },
    "design-sky": { primary: "#38BDF8", accent: "#7C3AED" },
    "bg-gradient": { primary: "#0ea5a4", accent: "#0369a1" },
  };
  return colors[skin] ?? colors.default;
}

export function calculateAvatarDimensions(muscleLevel: number): AvatarDimensions {
  const level = Math.max(1, muscleLevel);
  const chest = 40 + Math.min(60, (level - 1) * 12);
  const armWidth = 12 + Math.min(20, (level - 1) * 4);
  
  return { chest, armWidth };
}

export function generateAvatarPath(chest: number): string {
  return `M ${100 - chest / 2} 100 q ${chest / 2} 28 ${chest} 0 v 78 q -${chest} 34 -${chest} 0 z`;
}

export function generateAbsHighlights(muscleLevel: number): Array<{ x: number; y: number; width: number; height: number }> {
  const level = Math.max(1, muscleLevel);
  const count = Math.min(4, Math.floor(1 + (level - 1) * 1.2));
  
  return Array.from({ length: count }, (_, i) => ({
    x: 100 - 6,
    y: 128 + i * 8,
    width: 12,
    height: 6,
  }));
}