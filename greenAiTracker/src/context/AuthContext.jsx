import { createContext, useContext, useState } from "react";
import { getUserById, getUserByEmail, addUser } from "../data/userInformation.js";

const AuthContext = createContext(null);
const KEY = "gat-user-id";
const PROFILE_KEY = "gat-user-profile";

function readSaved(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

// Read the saved user id (from localStorage if "Remember me" was ticked, otherwise sessionStorage)
function loadSavedId() {
  const id = readSaved(KEY);
  if (id == null) return null;
  if (getUserById(id)) return id;

  const profile = readSaved(PROFILE_KEY);
  if (!profile?.email) return null;
  const existing = getUserByEmail(profile.email);
  if (existing) return existing.id;
  try {
    return addUser({ name: profile.name || profile.email, email: profile.email, password: crypto.randomUUID() }).id;
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
      for (const k of [KEY, PROFILE_KEY]) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      }
      const store = remember ? localStorage : sessionStorage;
      store.setItem(KEY, JSON.stringify(newUser.id));
      store.setItem(PROFILE_KEY, JSON.stringify({ name: newUser.name, email: newUser.email }));
    } catch {
      // storage blocked: the login still works until the page is refreshed
    }
    setUserId(newUser.id);
  }

  function logout() {
    try {
      for (const k of [KEY, PROFILE_KEY]) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      }
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