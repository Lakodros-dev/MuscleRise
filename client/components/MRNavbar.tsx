import { Link as RouterLink, NavLink } from "react-router-dom";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";

const MRNavbar = memo(function MRNavbar() {
  const { state } = useAppState();
  
  // Defensive check for state
  if (!state) {
    return (
      <header className="sticky top-0 z-40 w-full border-b backdrop-blur bg-black/50 border-white/10">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-extrabold tracking-tight text-xl text-primary">MuscleRise</div>
        </div>
      </header>
    );
  }
  const isWhiteTheme = state.theme.skin === "design-white";

  const linkClassName = useMemo(() => ({ isActive }: { isActive: boolean }) => 
    linkClass(isActive, isWhiteTheme), [isWhiteTheme]);

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b backdrop-blur",
      isWhiteTheme 
        ? "bg-black/95 border-white/20" 
        : "bg-black/50 border-white/10"
    )}>
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <RouterLink 
            to="/" 
            className="font-extrabold tracking-tight text-xl" 
            style={{ color: isWhiteTheme ? "white" : "rgb(var(--primary-rgb))" }}
          >
            MuscleRise
          </RouterLink>
        </div>

        <nav className="flex items-center gap-2 md:gap-4 text-sm">
          <NavLink className={linkClassName} to="/shop">
            Shop
          </NavLink>
          <NavLink className={linkClassName} to="/stats">
            Stats
          </NavLink>
          <NavLink className={linkClassName} to="/top">
            Top Users
          </NavLink>
          <NavLink className={linkClassName} to="/settings">
            Settings
          </NavLink>

          <div className="ml-2 flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
              isWhiteTheme ? "border-white/30 bg-white/10" : "border-white/10"
            )}>
              <span className={isWhiteTheme ? "text-white/90" : "opacity-70"}>Coins</span>
              <span className="font-semibold" style={{ color: isWhiteTheme ? "white" : "rgb(var(--primary-rgb))" }}>{state.coins}</span>
            </div>
            {state.user ? (
              <div className="flex items-center gap-2">
                <div className={cn("text-sm", isWhiteTheme ? "text-white/80" : "text-foreground/70")}>{state.user.name ?? ""}</div>
              </div>
            ) : null}
          </div>
        </nav>
      </div>
      <div className="w-full h-px bg-border" />
    </header>
  );
});

export default MRNavbar;

function linkClass(isActive: boolean, isWhiteTheme: boolean = false) {
  return cn(
    "px-2 py-1 rounded-md transition-colors",
    isWhiteTheme 
      ? (isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white")
      : (isActive ? "bg-white/10 text-foreground" : "text-foreground/80 hover:bg-white/5 hover:text-foreground"),
  );
}
