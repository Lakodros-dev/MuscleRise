import React, { createContext, useContext, useReducer } from "react";

export type UserProfile = {
  id?: string;
  username?: string;
  name?: string;
  weightKg: number;
  heightCm: number;
  avatarUrl?: string | null;
  musclesLevel: number; // visual scale
};

export type UserState = {
  user: UserProfile | null;
  coins: number;
};

export type UserAction =
  | { type: "REGISTER_USER"; payload: { name?: string; weightKg: number; heightCm: number; avatarUrl?: string | null } }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserProfile> }
  | { type: "ADD_COINS"; payload: { amount: number } }
  | { type: "HYDRATE_USER"; payload: Partial<UserState> }
  | { type: "LOGOUT" };

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "REGISTER_USER": {
      const user: UserProfile = {
        name: action.payload.name ?? undefined,
        weightKg: action.payload.weightKg,
        heightCm: action.payload.heightCm,
        avatarUrl: action.payload.avatarUrl ?? null,
        musclesLevel: 1,
      };
      return { ...state, user };
    }
    case "UPDATE_SETTINGS": {
      if (!state.user) return state;
      return { ...state, user: { ...state.user, ...action.payload } };
    }
    case "ADD_COINS": {
      return { ...state, coins: state.coins + action.payload.amount };
    }
    case "HYDRATE_USER": {
      return { ...state, ...action.payload };
    }
    case "LOGOUT": {
      return { user: null, coins: 0 };
    }
    default:
      return state;
  }
}

const UserContext = createContext<{ state: UserState; dispatch: React.Dispatch<UserAction> } | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
    coins: 0,
  });

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}