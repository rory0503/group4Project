import { createContext, useContext, useState } from "react";
import { getUserById, getUserByEmail } from "../data/userInformation.js";

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

// true if the saved login lives in localStorage (i.e. "Remember me" button was on)
function isRemembered() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
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
  return existing ? existing.id : null; // never invent a new account
}

// Wrap the whole app in this so every page can know who is logged in
export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(loadSavedId);
  const [remember, setRememberState] = useState(isRemembered);

  // The full user object (undefined if nobody is logged in)
  const user = userId ? getUserById(userId) : undefined;

  // Call after a successful login. `remember` keeps you logged in after the browser closes.
    // Writes the login into localStorage (keep = true) or sessionStorage (keep = false)
  function persist(u, keep) {
    try {
      for (const k of [KEY, PROFILE_KEY]) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      }
      const store = keep ? localStorage : sessionStorage;
      store.setItem(KEY, JSON.stringify(u.id));
      store.setItem(PROFILE_KEY, JSON.stringify({ name: u.name, email: u.email }));
    } catch {
      // storage blocked: login still works until refresh
    }
  }

  function login(newUser, keep = true) {
    persist(newUser, keep);
    setRememberState(keep);
    setUserId(newUser.id);
  }
  
  // Used by the Remember Me toggle on the Profile page
  function setRemember(keep) {
    if (user) persist(user, keep);
    setRememberState(keep);
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
    <AuthContext.Provider value={{ user, isLoggedIn: Boolean(user), remember, setRemember, login, logout }}>
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