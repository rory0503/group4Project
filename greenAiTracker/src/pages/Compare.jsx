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
import { T } from "../context/TranslationContext";
import "../styles/compare.css";

const MAX_MODELS = 3;

export default function Compare() {
  const { models, loading, error } = useModels();
  const [searchParams] = useSearchParams();
  const [dashboardId] = useLocalStorage("selected", "");
  const [profileSettings] = useLocalStorage("profile-settings", {});

  const [ids, setIds] = useState(() =>
    (searchParams.get("models") || "")
      .split(",")
      .filter(Boolean)
      .slice(0, MAX_MODELS)
  );

  const [metric, setMetric] = useState(profileSettings.metric ?? "water");
  const [mode, setMode] = useState("year");
  const [range, setRange] = useState(profileSettings.range ?? "all");
  const [linkStatus, setLinkStatus] = useState(null);

  const meta = METRICS[metric];

  const [favourites] = useFavourites();
  const pickerModels = favouritesFirst(models, favourites);

  useEffect(() => {
    if (!models.length) return;

    setIds((prev) => {
      const valid = [...new Set(prev)]
        .filter((id) => byId(models, id))
        .slice(0, MAX_MODELS);

      if (valid.length) {
        return valid.length === prev.length ? prev : valid;
      }

      return [dashboardId, ...models.map((m) => m.id)]
        .filter((id, i, all) => byId(models, id) && all.indexOf(id) === i)
        .slice(0, 2);
    });
  }, [models, dashboardId]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (ids.length) {
      url.searchParams.set("models", ids.join(","));
    } else {
      url.searchParams.delete("models");
    }

    window.history.replaceState(window.history.state, "", url);
  }, [ids]);

  const chosen = ids.map((id) => byId(models, id)).filter(Boolean);

  const chartItems = chosen.map((model, i) => ({
    model,
    slot: i,
  }));

  function changeSlot(index, newId) {
    setIds((prev) =>
      newId
        ? prev.map((id, i) => (i === index ? newId : id))
        : prev.filter((_, i) => i !== index)
    );
  }

  function addModel(newId) {
    if (newId) {
      setIds((prev) =>
        prev.length < MAX_MODELS ? [...prev, newId] : prev
      );
    }
  }

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
        <div className="page-head">
          <div>
            <h1><T>Compare Models</T></h1>
            <p>
              <T>Choose up to 3 models to compare their resource use side by side.</T>
            </p>
          </div>

          <button
            className="btn btn-outline"
            type="button"
            onClick={copyLink}
            disabled={!chosen.length}
          >
            <Link2 className="icon icon-sm" />
            <span aria-live="polite">
              {linkStatus === "copied"
                ? <T>Link copied</T>
                : linkStatus === "failed"
                  ? <T>Copy the address bar instead</T>
                  : <T>Copy link to comparison</T>}
            </span>
          </button>
        </div>

        {loading && (
          <p className="card"><T>Loading model data…</T></p>
        )}

        {error && (
          <div className="notice">
            <T>We couldn't load the model data. Try again in a moment.</T>
          </div>
        )}

        {!loading && !error && (
          <>
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

            {chosen.length > 0 && (
              <>
                <section className="section" aria-labelledby="trend-title">
                  <div
                    className="toolbar"
                    style={{
                      gridTemplateColumns: "repeat(2, minmax(0, 220px))",
                    }}
                  >
                    <div className="field">
                      <label className="label" htmlFor="mode">
                        <T>View</T>
                      </label>

                      <select
                        className="select"
                        id="mode"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                      >
                        <option value="year"><T>Per year</T></option>
                        <option value="cumulative"><T>Cumulative</T></option>
                      </select>
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="range">
                        <T>Time range</T>
                      </label>

                      <select
                        className="select"
                        id="range"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                      >
                        <option value="all">2020 – 2030</option>
                        <option value="last5"><T>Last 5 years</T></option>
                        <option value="proj"><T>Projection only</T></option>
                      </select>
                    </div>
                  </div>

                  <div className="chart-layout">
                    <div className="card chart-card">
                      <div className="chart-head">
                        <h2 id="trend-title">
                          <T>{meta.title}</T> <T>over time</T>
                        </h2>
                      </div>

                      <TrendChart
                        items={chartItems}
                        metric={metric}
                        mode={mode}
                        range={range}
                      />
                    </div>

                    <div className="card">
                      <MetricPicker
                        value={metric}
                        onChange={setMetric}
                      />
                    </div>
                  </div>
                </section>

                <section className="section" aria-labelledby="detail-title">
                  <div className="section-head">
                    <div>
                      <h2 id="detail-title">
                        <T>Detailed comparison</T>
                      </h2>
                      <p>
                        <T>The best value in each row is highlighted.</T>
                      </p>
                    </div>

                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() =>
                        exportCsv(chosen, "green-ai-tracker-comparison.csv")
                      }
                    >
                      <Download className="icon icon-sm" />
                      <T>Export comparison</T>
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
