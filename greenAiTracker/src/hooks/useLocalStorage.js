import { useState } from "react";

export default function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem("gat-" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  });
  const set = (next) => {
    setValue(next);
    try {
      localStorage.setItem("gat-" + key, JSON.stringify(next));
    } catch {}
  };
  return [value, set];
}