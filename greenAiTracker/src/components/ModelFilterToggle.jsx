// A line of text plus a button that switches between Claude, GPT and Gemini models and every model.
// shown = how many models are on screen, total = how many exist in the database.
export default function ModelFilterToggle({ showAll, setShowAll, shown, total }) {
  return (
    <div className="model-filter">
      <span className="card-sub">
        {showAll ? `Showing all ${total} models` : `Showing ${shown} Claude, GPT and Gemini models`}
      </span>
      <button type="button" className="btn btn-outline" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>
        {showAll ? "Show Claude, GPT and Gemini only" : "Show all models"}
      </button>
    </div>
  );
}
