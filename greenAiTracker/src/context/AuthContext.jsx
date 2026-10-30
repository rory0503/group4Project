import { createContext, useContext, useState } from "react";
import { getUserById } from "../data/userInformation.js";

const AuthContext = createContext(null);
const KEY = "gat-user-id";

// Read the saved user id (from localStorage if "Remember me" was ticked, otherwise sessionStorage)
function loadSavedId() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

// Wrap the whole app in this so every page can know who is logged in
export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(loadSavedId);

  // The full user object (undefined if nobody is logged in)
  const user = userId ? getUserById(userId) : undefined;

  // Call after a successful login. `remember` keeps you logged in after the browser closes.
  function login(newUser, remember = true) {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(newUser.id));
    } catch {
      // storage blocked: the login still works until the page is refreshed
    }
    setUserId(newUser.id);
  }

  function logout() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setUserId(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: Boolean(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use this in any component: const { user, isLoggedIn, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}