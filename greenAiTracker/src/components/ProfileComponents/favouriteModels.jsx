import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, LayoutDashboard, Plus, Search, Star, Undo2, X } from "lucide-react";
import useModels from "../../hooks/useModels";
import useLocalStorage from "../../hooks/useLocalStorage";
import { companyColors } from "../../data/models";
import useFavourites from "../../hooks/useFavourites";

// The most search results shown at once
const MAX_RESULTS = 6;

function FavouriteModel({ user }) {
  // Every model on the site (the search looks through these)
  const { models: allModels } = useModels();

  // The Dashboard opens on whichever model is saved under "selected"
  const [, setSelected] = useLocalStorage("selected", "");

  const [favourites, setFavourites] = useFavourites();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0); // which search result the arrow keys are on
  const [removed, setRemoved] = useState(null); // the last removed model, for Undo
  const undoTimer = useRef(null);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  // Search by model name or company, leaving out models already in the list
  const text = query.trim().toLowerCase();
  const inList = new Set(favourites.map((m) => m.id));
  const matches = text
    ? allModels.filter(
        (m) => !inList.has(m.id) && (m.name.toLowerCase().includes(text) || m.company.toLowerCase().includes(text))
      )
    : [];
  const shown = matches.slice(0, MAX_RESULTS);

  // Adds a model from the results and clears the search
  function addFavourite(model) {
    setFavourites([...favourites, { id: model.id, name: model.name, company: model.company }]);
    setQuery("");
    setActive(0);
  }

  // Removes a model and offers Undo for 6 seconds
  function removeFavourite(model) {
    const index = favourites.findIndex((m) => m.id === model.id);
    setFavourites(favourites.filter((m) => m.id !== model.id));
    setRemoved({ model, index });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 6000);
  }

  // Puts the removed model back where it was
  function undoRemove() {
    if (!removed) return;
    const next = [...favourites];
    next.splice(removed.index, 0, removed.model);
    setFavourites(next);
    setRemoved(null);
    clearTimeout(undoTimer.current);
  }

  // Keyboard: arrows move through the results, Enter adds, Escape clears
  function handleKeyDown(e) {
    if (e.key === "Escape") setQuery("");
    if (!shown.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + shown.length) % shown.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      addFavourite(shown[Math.min(active, shown.length - 1)]);
    }
  }

  return (
    <section className="card favourites" aria-labelledby="favourites-title">
      <div className="card-head">
        <div>
          <h2 className="card-title" id="favourites-title">
            <Star className="icon" />
            Favourite Models
          </h2>
          <p className="card-sub">Your selected models will appear first in your dashboard and comparisons.</p>
        </div>
      </div>

      {/* Search bar: type a model or company name to find a model to add */}
      <div className="fav-search">
        <div className="input-wrap">
          <Search className="icon icon-sm fav-search__icon" aria-hidden="true" />
          <input
            className="input fav-search__input"
            type="text"
            role="combobox"
            aria-expanded={Boolean(text)}
            aria-controls="fav-results"
            aria-activedescendant={shown.length ? `fav-result-${Math.min(active, shown.length - 1)}` : undefined}
            aria-autocomplete="list"
            placeholder="Search models to add…"
            aria-label="Search models to add to your favourites"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button className="input-icon" type="button" aria-label="Clear search" onClick={() => setQuery("")}>
              <X className="icon icon-sm" />
            </button>
          )}
        </div>

        {/* Results appear under the bar once something is typed */}
        {text && (
          <ul className="fav-results" id="fav-results" role="listbox" aria-label="Search results">
            {matches.length === 0 ? (
              <li className="fav-results__empty">No models match “{query.trim()}”.</li>
            ) : (
              shown.map((model, i) => (
                <li
                  key={model.id}
                  id={`fav-result-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`fav-result${i === active ? " fav-result--active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addFavourite(model)}
                >
                  <span className="avatar" style={{ "--c": companyColors[model.company] }} aria-hidden="true">
                    {model.name.charAt(0)}
                  </span>
                  <span className="fav-result__text">
                    <span className="fav-result__name">{model.name}</span>
                    <span className="fav-result__company">{model.company}</span>
                  </span>
                  <span className="fav-result__add">
                    <Plus className="icon icon-sm" />
                    Add
                  </span>
                </li>
              ))
            )}
            {matches.length > MAX_RESULTS && (
              <li className="fav-results__more">Showing {MAX_RESULTS} of {matches.length}. Keep typing to narrow it down.</li>
            )}
          </ul>
        )}
      </div>

      {/* Undo message after removing a model */}
      {removed && (
        <div className="undo-bar" role="status">
          <span>Removed {removed.model.name}.</span>
          <button className="link-btn" type="button" onClick={undoRemove}>
            <Undo2 className="icon icon-sm" />
            Undo
          </button>
        </div>
      )}

      {/* The user's favourites */}
      <div className="favourites-list">
        {favourites.length === 0 ? (
          <p className="favourites-empty">No favourite models yet. Use the search bar above to add one.</p>
        ) : (
          favourites.map((fav) => {
            // Current details (rank and score) from the main model list, if it has this model
            const model = allModels.find((m) => m.id === fav.id) ?? fav;
            return (
              <div className="model-card" key={fav.id}>
                {/* Company initial in the company colour, same as the Compare page */}
                <span className="avatar avatar-lg" style={{ "--c": companyColors[model.company] }} aria-hidden="true">
                  {model.name.charAt(0)}
                </span>
                <div className="model-card__text">
                  <p className="model-card__name">{model.name}</p>
                  <p className="model-card__company">
                    {model.company}
                    {model.rank ? ` · Rank #${model.rank}` : ""}
                    {model.score != null ? ` · Score ${model.score}/30` : ""}
                  </p>
                </div>

                {/* Quick actions */}
                <Link
                  className="icon-action"
                  to="/"
                  title="View on the dashboard"
                  aria-label={`View ${model.name} on the dashboard`}
                  onClick={() => setSelected(model.id)}
                >
                  <LayoutDashboard className="icon icon-sm" />
                </Link>
                <Link
                  className="icon-action"
                  to={`/compare?models=${encodeURIComponent(model.id)}`}
                  title="Compare this model"
                  aria-label={`Compare ${model.name}`}
                >
                  <ArrowLeftRight className="icon icon-sm" />
                </Link>
                <button
                  type="button"
                  className="icon-action icon-action--star"
                  title="Remove from favourites"
                  aria-label={`Remove ${model.name} from favourites`}
                  onClick={() => removeFavourite(model)}
                >
                  <Star className="star-icon star-icon--filled" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default FavouriteModel;