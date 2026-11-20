
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Plus,
  Search,
  Star,
  Undo2,
  X,
} from "lucide-react";

import useModels from "../../hooks/useModels";
import useLocalStorage from "../../hooks/useLocalStorage";
import { companyColors } from "../../data/models";
import useFavourites from "../../hooks/useFavourites";
import {
  T,
  useTranslatedText,
} from "../../context/TranslationContext";

const MAX_RESULTS = 6;

function FavouriteModel({ user }) {
  const { models: allModels } = useModels();
  const [, setSelected] = useLocalStorage("selected", "");
  const [favourites, setFavourites] = useFavourites();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [removed, setRemoved] = useState(null);

  const undoTimer = useRef(null);

  const searchPlaceholder = useTranslatedText(
    "Search models to add…"
  );

  const searchLabel = useTranslatedText(
    "Search models to add to your favourites"
  );

  const clearSearchLabel = useTranslatedText("Clear search");
  const searchResultsLabel = useTranslatedText("Search results");
  const dashboardTitle = useTranslatedText("View on the dashboard");
  const compareTitle = useTranslatedText("Compare this model");
  const removeTitle = useTranslatedText("Remove from favourites");
  const dashboardLabel = useTranslatedText("View");
  const compareLabel = useTranslatedText("Compare");
  const removeLabel = useTranslatedText("Remove");

  useEffect(() => {
    return () => clearTimeout(undoTimer.current);
  }, []);

  const text = query.trim().toLowerCase();

  const inList = new Set(favourites.map((m) => m.id));

  const matches = text
    ? allModels.filter(
        (m) =>
          !inList.has(m.id) &&
          (
            m.name.toLowerCase().includes(text) ||
            m.company.toLowerCase().includes(text)
          )
      )
    : [];

  const shown = matches.slice(0, MAX_RESULTS);

  function addFavourite(model) {
    setFavourites([
      ...favourites,
      {
        id: model.id,
        name: model.name,
        company: model.company,
      },
    ]);

    setQuery("");
    setActive(0);
  }

  function removeFavourite(model) {
    const index = favourites.findIndex((m) => m.id === model.id);

    setFavourites(
      favourites.filter((m) => m.id !== model.id)
    );

    setRemoved({ model, index });

    clearTimeout(undoTimer.current);

    undoTimer.current = setTimeout(
      () => setRemoved(null),
      6000
    );
  }

  function undoRemove() {
    if (!removed) return;

    const next = [...favourites];

    next.splice(removed.index, 0, removed.model);

    setFavourites(next);
    setRemoved(null);

    clearTimeout(undoTimer.current);
  }

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
    <section
      className="card favourites"
      aria-labelledby="favourites-title"
    >
      <div className="card-head">
        <div>
          <h2 className="card-title" id="favourites-title">
            <Star className="icon" />
            <T>Favourite Models</T>
          </h2>

          <p className="card-sub">
            <T>
              Your selected models will appear first in your dashboard and comparisons.
            </T>
          </p>
        </div>
      </div>

      <div className="fav-search">
        <div className="input-wrap">
          <Search
            className="icon icon-sm fav-search__icon"
            aria-hidden="true"
          />

          <input
            className="input fav-search__input"
            type="text"
            role="combobox"
            aria-expanded={Boolean(text)}
            aria-controls="fav-results"
            aria-activedescendant={
              shown.length
                ? `fav-result-${Math.min(active, shown.length - 1)}`
                : undefined
            }
            aria-autocomplete="list"
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
          />

          {query && (
            <button
              className="input-icon"
              type="button"
              aria-label={clearSearchLabel}
              title={clearSearchLabel}
              onClick={() => setQuery("")}
            >
              <X className="icon icon-sm" />
            </button>
          )}
        </div>

        {text && (
          <ul
            className="fav-results"
            id="fav-results"
            role="listbox"
            aria-label={searchResultsLabel}
          >
            {matches.length === 0 ? (
              <li className="fav-results__empty">
                <T>No models match</T> “{query.trim()}”.
              </li>
            ) : (
              shown.map((model, i) => (
                <li
                  key={model.id}
                  id={`fav-result-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`fav-result${
                    i === active ? " fav-result--active" : ""
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addFavourite(model)}
                >
                  <span
                    className="avatar"
                    style={{
                      "--c": companyColors[model.company],
                    }}
                    aria-hidden="true"
                  >
                    {model.name.charAt(0)}
                  </span>

                  <span className="fav-result__text">
                    <span className="fav-result__name">
                      {model.name}
                    </span>

                    <span className="fav-result__company">
                      {model.company}
                    </span>
                  </span>

                  <span className="fav-result__add">
                    <Plus className="icon icon-sm" />
                    <T>Add</T>
                  </span>
                </li>
              ))
            )}

            {matches.length > MAX_RESULTS && (
              <li className="fav-results__more">
                <T>Showing</T> {MAX_RESULTS} <T>of</T>{" "}
                {matches.length}.
                {" "}
                <T>Keep typing to narrow it down.</T>
              </li>
            )}
          </ul>
        )}
      </div>

      {removed && (
        <div className="undo-bar" role="status">
          <span>
            <T>Removed</T> {removed.model.name}.
          </span>

          <button
            className="link-btn"
            type="button"
            onClick={undoRemove}
          >
            <Undo2 className="icon icon-sm" />
            <T>Undo</T>
          </button>
        </div>
      )}

      <div className="favourites-list">
        {favourites.length === 0 ? (
          <p className="favourites-empty">
            <T>
              No favourite models yet. Use the search bar above to add one.
            </T>
          </p>
        ) : (
          favourites.map((fav) => {
            const model =
              allModels.find((m) => m.id === fav.id) ?? fav;

            return (
              <div className="model-card" key={fav.id}>
                <span
                  className="avatar avatar-lg"
                  style={{
                    "--c": companyColors[model.company],
                  }}
                  aria-hidden="true"
                >
                  {model.name.charAt(0)}
                </span>

                <div className="model-card__text">
                  <p className="model-card__name">
                    {model.name}
                  </p>

                  <p className="model-card__company">
                    {model.company}
                    {model.rank ? ` · Rank #${model.rank}` : ""}
                    {model.score != null
                      ? ` · Score ${model.score}/30`
                      : ""}
                  </p>
                </div>

                <Link
                  className="icon-action"
                  to="/"
                  title={dashboardTitle}
                  aria-label={`${dashboardLabel}: ${model.name}`}
                  onClick={() => setSelected(model.id)}
                >
                  <LayoutDashboard className="icon icon-sm" />
                </Link>

                <Link
                  className="icon-action"
                  to={`/compare?models=${encodeURIComponent(model.id)}`}
                  title={compareTitle}
                  aria-label={`${compareLabel}: ${model.name}`}
                >
                  <ArrowLeftRight className="icon icon-sm" />
                </Link>

                <button
                  type="button"
                  className="icon-action icon-action--star"
                  title={removeTitle}
                  aria-label={`${removeLabel}: ${model.name}`}
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
