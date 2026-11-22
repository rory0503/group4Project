import useLocalStorage from "./useLocalStorage";
import { useAuth } from "../context/AuthContext";

// The logged-in user's favourite models. Saved in this browser under the same key the Profile page uses.
// Returns [favourites, setFavourites].
export default function useFavourites() {
  const { user } = useAuth();
  const [stored, setStored] = useLocalStorage(`favourites-${user?.id ?? "guest"}`, null);
  // The first time, start from the favourites the user already has
  const favourites = stored ?? (user?.favouriteModels ?? []).filter((m) => m.isFavourite !== false);
  return [favourites, setStored];
}

// Puts favourite models first, then everything else, each group in rank order
export function favouritesFirst(models, favourites) {
  const ids = new Set(favourites.map((m) => m.id));
  return [...models].sort((a, b) => (ids.has(b.id) - ids.has(a.id)) || ((a.rank ?? 0) - (b.rank ?? 0)));
}