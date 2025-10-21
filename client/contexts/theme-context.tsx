import React, { createContext, useContext, useReducer } from "react";

export type ThemeState = {
  skin: string;
  unlockedSkins: string[];
  outfitsUnlocked: string[];
  primaryChoicesOwned?: string[];
  customPrimary?: string | null;
};

export type ThemeAction =
  | { type: "PURCHASE_SKIN"; payload: { id: string } }
  | { type: "PURCHASE_OUTFIT"; payload: { id: string } }
  | { type: "SET_SKIN"; payload: { skin: string } }
  | { type: "SET_CUSTOM_PRIMARY"; payload: { primary: string } }
  | { type: "HYDRATE_THEME"; payload: Partial<ThemeState> };

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case "PURCHASE_SKIN": {
      const isCustom = action.payload.id.startsWith("primary-custom:");
      const unlocked = Array.from(new Set([...state.unlockedSkins, action.payload.id]));
      const primaryOwned = Array.from(new Set([
        ...(state.primaryChoicesOwned ?? []),
        ...(action.payload.id.startsWith("primary-") ? [action.payload.id] : [])
      ]));
      
      if (isCustom) {
        const parts = action.payload.id.split(":");
        const hsl = parts.slice(1).join(":");
        return {
          ...state,
          unlockedSkins: unlocked,
          skin: "primary-custom",
          primaryChoicesOwned: primaryOwned,
          customPrimary: hsl,
        };
      }
      
      return {
        ...state,
        unlockedSkins: unlocked,
        skin: action.payload.id,
        primaryChoicesOwned: primaryOwned,
      };
    }
    case "PURCHASE_OUTFIT": {
      const outfits = Array.from(new Set([...state.outfitsUnlocked, action.payload.id]));
      return { ...state, outfitsUnlocked: outfits };
    }
    case "SET_SKIN": {
      return { ...state, skin: action.payload.skin };
    }
    case "SET_CUSTOM_PRIMARY": {
      return { ...state, customPrimary: action.payload.primary };
    }
    case "HYDRATE_THEME": {
      return { ...state, ...action.payload };
    }
    default:
      return state;
  }
}

const ThemeContext = createContext<{ state: ThemeState; dispatch: React.Dispatch<ThemeAction> } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, {
    skin: "default",
    unlockedSkins: ["default"],
    outfitsUnlocked: [],
    primaryChoicesOwned: [],
    customPrimary: null,
  });

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}