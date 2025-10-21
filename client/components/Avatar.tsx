import { useAppState } from "@/state/app-state";
import { getAvatarColors, calculateAvatarDimensions, generateAvatarPath, generateAbsHighlights } from "@/lib/avatar-utils";
import { memo, useMemo } from "react";

interface AvatarProps {
  size?: number;
}

export default memo(function Avatar({ size = 200 }: AvatarProps) {
  const { state } = useAppState();

  const avatarData = useMemo(() => {
    const level = Math.max(1, state.user?.musclesLevel ?? 1);
    const skin = state.theme.skin;
    const palette = getAvatarColors(skin);
    const { chest, armWidth } = calculateAvatarDimensions(level);
    const chestPath = generateAvatarPath(chest);
    const absHighlights = generateAbsHighlights(level);

    return { palette, chest, armWidth, chestPath, absHighlights };
  }, [state.user?.musclesLevel, state.theme.skin]);

  const { palette, chest, armWidth, chestPath, absHighlights } = avatarData;

  return (
    <div className="relative mx-auto">
      <svg width={size} height={size} viewBox="0 0 200 260" className="drop-shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
        <defs>
          <linearGradient id="skinGrad" x1="0" x2="1">
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={200} height={260} rx={18} fill="#050507" />

        {/* Head */}
        <g>
          <ellipse cx={100} cy={60} rx={26} ry={30} fill="#f1c27d" />
          <ellipse cx={100} cy={60} rx={24} ry={26} fill="#e0a86b" opacity={0.7} />

          {/* Eyes */}
          <ellipse cx={90} cy={58} rx={3} ry={2} fill="#2b2b2b" />
          <ellipse cx={110} cy={58} rx={3} ry={2} fill="#2b2b2b" />
          {/* Mouth */}
          <path d="M90 70 q10 6 20 0" stroke="#7a2f2f" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </g>

        {/* Neck */}
        <rect x={92} y={88} width={16} height={14} rx={4} fill="#e0a86b" />

        {/* Shoulders / Arms with rounded muscles */}
        <g fill="url(#skinGrad)" opacity={0.98}>
          <rect x={100 - chest / 2 - armWidth - 8} y={104} width={armWidth} height={64} rx={armWidth / 2} />
          <rect x={100 + chest / 2 + 8} y={104} width={armWidth} height={64} rx={armWidth / 2} />
        </g>

        {/* Chest / Torso with smoother curves */}
        <g>
          <path d={chestPath} fill="url(#skinGrad)" opacity={0.98} />
        </g>

        {/* Abs highlights */}
        <g fill="#000" opacity={0.1}>
          {absHighlights.map((abs, i) => (
            <rect key={i} x={abs.x} y={abs.y} width={abs.width} height={abs.height} rx={3} />
          ))}
        </g>

        {/* Legs */}
        <g fill={palette.accent} opacity={0.95}>
          <rect x={86} y={194} width={18} height={56} rx={9} />
          <rect x={96 + 12} y={194} width={18} height={56} rx={9} />
        </g>
      </svg>

      {/* Show user name under avatar */}
      <div className="mt-3 text-center">
        <div className="font-semibold text-lg">{state.user?.name ?? "Guest"}</div>
        <div className="text-xs text-foreground/60">Weight: {state.user?.weightKg ?? "-"} kg • Height: {state.user?.heightCm ?? "-"} cm</div>
      </div>
    </div>
  );
});
