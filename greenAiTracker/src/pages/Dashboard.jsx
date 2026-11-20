import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ArrowRight, X } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import useModels from "../hooks/useModels";
import { tips } from "../data/models";
import { METRICS, byId, average, sortModels } from "../lib/helpers";
import exportCsv from "../lib/exportCsv";
import StatCard from "../components/DashboardComponents/StatCard";
import TipsElement from "../components/DashboardComponents/TipsElement";
import MetricPicker from "../components/MetricPicker";
import ModelPicker from "../components/ModelPicker";
import ModelTable from "../components/ModelTable";
import TrendChart from "../components/TrendChart";
import useFavourites, { favouritesFirst } from "../hooks/useFavourites";
import { T, useTranslation } from "../context/TranslationContext";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { models, loading, error } = useModels();
  const [primaryId, setPrimaryId] = useLocalStorage("selected", "");

  // The defaults saved on the Profile page
  const [profileSettings] = useLocalStorage("profile-settings", {});
  const [secondId, setSecondId] = useState(null);
  const [metric, setMetric] = useState(profileSettings.metric ?? "water");
  const [mode, setMode] = useState("year");
  const [range, setRange] = useState(profileSettings.range ?? "all");
  const [sort, setSort] = useState({ key: "score", dir: "desc" });
  const [favourites] = useFavourites();

  const { lang, translateTexts } = useTranslation();

  const [dashboardText, setDashboardText] = useState({
    keyFigures: "Key figures",
    removeSecondModel: "Remove second model",
    modelLabel: "Model",
    compareWithLabel: "Compare with",
    addSecondModel: "Add a second model",
  });

  useEffect(() => {
    let active = true;

    const originalTexts = [
      "Key figures",
      "Remove second model",
      "Model",
      "Compare with",
      "Add a second model",
    ];

    translateTexts(originalTexts).then((translated) => {
      if (!active || !Array.isArray(translated)) return;

      setDashboardText({
        keyFigures: translated[0] || originalTexts[0],
        removeSecondModel: translated[1] || originalTexts[1],
        modelLabel: translated[2] || originalTexts[2],
        compareWithLabel: translated[3] || originalTexts[3],
        addSecondModel: translated[4] || originalTexts[4],
      });
    });

    return () => {
      active = false;
    };
  }, [lang, translateTexts]);

  const pickerModels = favouritesFirst(models, favourites);

  // Find model by id or default to first model
  const model = byId(models, primaryId) ?? models[0];
  const meta = METRICS[metric];

  // Sorting functionality
  function handleSort(key) {
    setSort((s) => ({
      key,
      dir:
        s.key === key
          ? s.dir === "asc"
            ? "desc"
            : "asc"
          : key === "score"
            ? "desc"
            : "asc",
    }));
  }

  // Top 3 models by score, plus selected models
  const ids = new Set(
    sortModels(models, "score", "desc")
      .slice(0, 3)
      .map((m) => m.id)
  );

  if (model) ids.add(model.id);
  if (secondId) ids.add(secondId);

  const tableModels = sortModels(
    models.filter((m) => ids.has(m.id)),
    sort.key,
    sort.dir
  );

  // Models displayed on the chart
  const second = secondId ? byId(models, secondId) : null;

  const chartItems = [
    { model, slot: 0 },
    ...(second ? [{ model: second, slot: 1 }] : []),
  ];

  return (
    <main id="main" className="page">
      <div className="container">

        <div className="page-head">
          <div>
            <h1>
              <T>AI Model Expenditure</T>
            </h1>

            {model && (
              <p>
                <T>The yearly resource footprint of</T>{" "}
                <strong>{model.name}</strong>
                <T>, and how it compares.</T>
              </p>
            )}
          </div>
        </div>

        {/* Loading, error and empty states */}
        {loading && (
          <p className="card">
            <T>Loading model data…</T>
          </p>
        )}

        {error && (
          <div className="notice">
            <T>We couldn't load the model data. Try again in a moment.</T>
          </div>
        )}

        {!loading && !error && !model && (
          <p className="card">
            <T>No models are available yet.</T>
          </p>
        )}

        {/* Dashboard content */}
        {model && (
          <>
            {/* Statistics cards */}
            <section className="stats" aria-label={dashboardText.keyFigures}>
              {Object.values(METRICS).map((m) => (
                <StatCard
                  key={m.key}
                  meta={m}
                  model={model}
                  average={average(models, m.key)}
                />
              ))}
            </section>

            {/* Model selection and chart controls */}
            <section className="section" aria-labelledby="trend-title">
              <div className="toolbar">

                <div className="field">
                  <span className="label">
                    <T>Model</T>
                  </span>

                  <ModelPicker
                    models={pickerModels}
                    value={model.id}
                    onChange={setPrimaryId}
                    label={dashboardText.modelLabel}
                    exclude={secondId ? [secondId] : []}
                  />
                </div>

                {/* Second model comparison */}
                <div className="field">
                  <span className="label">
                    <T>Compare with</T>{" "}
                    <span className="hint">
                      (<T>optional</T>)
                    </span>
                  </span>

                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ModelPicker
                        models={pickerModels}
                        value={secondId}
                        onChange={setSecondId}
                        label={dashboardText.compareWithLabel}
                        placeholder={dashboardText.addSecondModel}
                        exclude={[model.id]}
                      />
                    </div>

                    {secondId && (
                      <button
                        className="btn btn-outline"
                        type="button"
                        aria-label={dashboardText.removeSecondModel}
                        onClick={() => setSecondId(null)}
                      >
                        <X className="icon icon-sm" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chart view */}
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
                    <option value="year">
                      <T>Per year</T>
                    </option>

                    <option value="cumulative">
                      <T>Cumulative</T>
                    </option>
                  </select>
                </div>

                {/* Chart time range */}
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
                    <option value="last5">
                      <T>Last 5 years</T>
                    </option>
                    <option value="proj">
                      <T>Projection only</T>
                    </option>
                  </select>
                </div>

              </div>

              {/* Chart layout */}
              <div className="chart-layout">

                <div className="card chart-card">
                  <div className="chart-head">
                    <h2 id="trend-title">
                      <T>{meta.title}</T>{" "}
                      <T>over time</T>
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

            {/* Rankings table */}
            <section className="section" aria-labelledby="table-title">
              <div className="section-head">

                <div>
                  <h2 id="table-title">
                    <T>How it ranks</T>
                  </h2>

                  <p>
                    <T>
                      Top 3 models by sustainability score, plus the model you're viewing.
                    </T>
                  </p>
                </div>

                {/* Export data */}
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => exportCsv(models)}
                >
                  <Download className="icon icon-sm" />
                  <T>Export data</T>
                </button>

              </div>

              <ModelTable
                models={tableModels}
                selectedId={model.id}
                sort={sort}
                onSort={handleSort}
                showRank
              />

              <Link
                className="btn btn-primary btn-block"
                to="/rankings"
                style={{ marginTop: 12 }}
              >
                <T>View full rankings</T>
                <ArrowRight className="icon icon-sm" />
              </Link>
            </section>

            {/* Sustainable AI tips */}
            <section className="section" aria-labelledby="tips-title">
              <div className="section-head">
                <h2 id="tips-title">
                  <T>Sustainable AI prompt tips</T>
                </h2>
              </div>

              <TipsElement tips={tips} />
            </section>

          </>
        )}
      </div>
    </main>
  );
}
