import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link2, Download } from "lucide-react";
import useModels from "../hooks/useModels";
import useLocalStorage from "../hooks/useLocalStorage";
import { METRICS, byId } from "../lib/helpers";
import exportCsv from "../lib/exportCsv";
import MetricPicker from "../components/MetricPicker";
import ModelSelectCard from "../components/CompareComponents/ModelSelectCard";
import InsightCards from "../components/CompareComponents/InsightCards";
import CompareTable from "../components/CompareComponents/CompareTable";
import TrendChart from "../components/TrendChart";
import useFavourites, { favouritesFirst } from "../hooks/useFavourites";
import "../styles/compare.css";

// The most models that can be compared at once
const MAX_MODELS = 3;

export default function Compare() {
  // All models, plus loading/error states
  const { models, loading, error } = useModels();
  const [searchParams] = useSearchParams();
  // The model last viewed on the Dashboard (used as a starting choice)
  const [dashboardId] = useLocalStorage("selected", "");
  // The defaults saved on the Profile page (default metric and time range)
  const [profileSettings] = useLocalStorage("profile-settings", {});

  // The chosen models IDs (1–3). Starts from a shared link (?models=a,b,c) if there is one.
  const [ids, setIds] = useState(() =>
    (searchParams.get("models") || "").split(",").filter(Boolean).slice(0, MAX_MODELS)
  );
  // Chart settings. They start on the defaults saved on the Profile page.
  const [metric, setMetric] = useState(profileSettings.metric ?? "water");
  const [mode, setMode] = useState("year");
  const [range, setRange] = useState(profileSettings.range ?? "all");
  const [linkStatus, setLinkStatus] = useState(null); // null | "copied" | "failed"

  // Details of the selected metric (title)
  const meta = METRICS[metric];

  const [favourites] = useFavourites();
  const pickerModels = favouritesFirst(models, favourites);

  // Once the models have loaded: drop any unknown ids from the link, and if nothing is
  // left start with the dashboard model plus the top-ranked one.
  useEffect(() => {
    if (!models.length) return;
    setIds((prev) => {
      const valid = [...new Set(prev)].filter((id) => byId(models, id)).slice(0, MAX_MODELS);
      if (valid.length) return valid.length === prev.length ? prev : valid;
      return [dashboardId, ...models.map((m) => m.id)]
        .filter((id, i, all) => byId(models, id) && all.indexOf(id) === i)
        .slice(0, 2);
    });
  }, [models, dashboardId]);

  // Keep the address bar in sync so "Copy link" always shares the current comparison
  useEffect(() => {
    const url = new URL(window.location.href);
    if (ids.length) url.searchParams.set("models", ids.join(","));
    else url.searchParams.delete("models");
    window.history.replaceState(window.history.state, "", url);
  }, [ids]);

  // Turn the chosen ids into full model objects
  const chosen = ids.map((id) => byId(models, id)).filter(Boolean);

  // The lines on the chart: one per chosen model (slot 0, 1 and 2 pick the line colours)
  const chartItems = chosen.map((model, i) => ({ model, slot: i }));

  // Picking a model replaces that slot; clearing it (null) removes the slot
  function changeSlot(index, newId) {
    setIds((prev) =>
      newId ? prev.map((id, i) => (i === index ? newId : id)) : prev.filter((_, i) => i !== index)
    );
  }

  // Adds a model to the end (up to the maximum)
  function addModel(newId) {
    if (newId) setIds((prev) => (prev.length < MAX_MODELS ? [...prev, newId] : prev));
  }

  // Copies the page link, then shows "Link copied" for 2.5 seconds
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkStatus("copied");
    } catch {
      setLinkStatus("failed");
    }
    setTimeout(() => setLinkStatus(null), 2500);
  }

  return (
    <main id="main" className="page">
      <div className="container">
        {/* Page title and the copy-link button */}
        <div className="page-head">
          <div>
            <h1>Compare Models</h1>
            <p>Choose up to 3 models to compare their resource use side by side.</p>
          </div>
          <button className="btn btn-outline" type="button" onClick={copyLink} disabled={!chosen.length}>
            <Link2 className="icon icon-sm" />
            <span aria-live="polite">
              {linkStatus === "copied"
                ? "Link copied"
                : linkStatus === "failed"
                  ? "Copy the address bar instead"
                  : "Copy link to comparison"}
            </span>
          </button>
        </div>

        {/* Loading and error messages */}
        {loading && <p className="card">Loading model data…</p>}
        {error && <div className="notice">We couldn't load the model data. Try again in a moment.</div>}

        {!loading && !error && (
          <>
            {/* The model cards: one per chosen model, plus an empty one to add another */}
            <section className="slots" aria-label="Models being compared">
              {chosen.map((model, i) => (
                <ModelSelectCard
                  key={model.id}
                  slot={i + 1}
                  models={pickerModels}
                  value={model.id}
                  onChange={(newId) => changeSlot(i, newId)}
                  exclude={ids.filter((_, j) => j !== i)}
                />
              ))}
              {chosen.length < MAX_MODELS && (
                <ModelSelectCard
                  key="new"
                  slot={chosen.length + 1}
                  models={pickerModels}
                  value={null}
                  onChange={addModel}
                  exclude={ids}
                />
              )}
            </section>

            {/* Everything below only shows once at least one model is chosen */}
            {chosen.length > 0 && (
              <>
                {/* Chart section: dropdowns, the line chart and the metric picker */}
                <section className="section" aria-labelledby="trend-title">
                  <div className="toolbar" style={{ gridTemplateColumns: "repeat(2, minmax(0, 220px))" }}>
                    <div className="field">
                      <label className="label" htmlFor="mode">View</label>
                      <select className="select" id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value="year">Per year</option>
                        <option value="cumulative">Cumulative</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="range">Time range</label>
                      <select className="select" id="range" value={range} onChange={(e) => setRange(e.target.value)}>
                        <option value="all">2020 – 2030</option>
                        <option value="last5">Last 5 years</option>
                        <option value="proj">Projection only</option>
                      </select>
                    </div>
                  </div>

                  <div className="chart-layout">
                    <div className="card chart-card">
                      <div className="chart-head">
                        <h2 id="trend-title">{meta.title} over time</h2>
                      </div>
                      {/* the line chart, with its own coloured key (legend) and axis labels */}
                      <TrendChart items={chartItems} metric={metric} mode={mode} range={range} />
                    </div>

                    <div className="card">
                      <MetricPicker value={metric} onChange={setMetric} />
                    </div>
                  </div>
                </section>

                {/* Comparison section: export button, insight lines and the table */}
                <section className="section" aria-labelledby="detail-title">
                  <div className="section-head">
                    <div>
                      <h2 id="detail-title">Detailed comparison</h2>
                      <p>The best value in each row is highlighted.</p>
                    </div>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => exportCsv(chosen, "green-ai-tracker-comparison.csv")}
                    >
                      <Download className="icon icon-sm" />Export comparison
                    </button>
                  </div>

                  <InsightCards models={chosen} />
                  <CompareTable models={chosen} total={models.length} />
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}