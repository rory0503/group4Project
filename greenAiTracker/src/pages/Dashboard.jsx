import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, Download, ArrowRight, X } from "lucide-react";
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

export default function Dashboard() {
  const { models, loading, error } = useModels();
  const [primaryId, setPrimaryId] = useLocalStorage("selected", "");
  const [secondId, setSecondId] = useState(null);
  const [metric, setMetric] = useState("water");
  const [mode, setMode] = useState("year");
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState({ key: "score", dir: "desc" });

  const model = byId(models, primaryId) ?? models[0];
  const meta = METRICS[metric];

  // Clicking the same heading flips the direction; a new heading starts ascending
  // (the score starts highest first).
  function handleSort(key) {
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === "asc" ? "desc" : "asc") : key === "score" ? "desc" : "asc",
    }));
  }

  // The top 3 models by score, plus the models being viewed
  const ids = new Set(sortModels(models, "score", "desc").slice(0, 3).map((m) => m.id));
  if (model) ids.add(model.id);
  if (secondId) ids.add(secondId);
  const tableModels = sortModels(models.filter((m) => ids.has(m.id)), sort.key, sort.dir);

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>AI Model Expenditure</h1>
            {model && (
              <p>The yearly resource footprint of <strong>{model.name}</strong>, and how it compares.</p>
            )}
          </div>
          <span className="badge"><Info className="icon icon-sm" />Illustrative sample data</span>
        </div>

        {loading && <p className="card">Loading model data…</p>}
        {error && <div className="notice">We couldn't load the model data. Try again in a moment.</div>}
        {!loading && !error && !model && <p className="card">No models are available yet.</p>}

        {model && (
          <>
            <section className="stats" aria-label="Key figures">
              {Object.values(METRICS).map((m) => (
                <StatCard key={m.key} meta={m} model={model} average={average(models, m.key)} />
              ))}
            </section>

            <section className="section" aria-labelledby="trend-title">
              <div className="toolbar">
                <div className="field">
                  <span className="label">Model</span>
                  <ModelPicker
                    models={models}
                    value={model.id}
                    onChange={setPrimaryId}
                    label="Model"
                    exclude={secondId ? [secondId] : []}
                  />
                </div>

                <div className="field">
                  <span className="label">Compare with <span className="hint">(optional)</span></span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ModelPicker
                        models={models}
                        value={secondId}
                        onChange={setSecondId}
                        label="Compare with"
                        placeholder="Add a second model"
                        exclude={[model.id]}
                      />
                    </div>
                    {secondId && (
                      <button
                        className="btn btn-outline"
                        type="button"
                        aria-label="Remove second model"
                        onClick={() => setSecondId(null)}
                      >
                        <X className="icon icon-sm" />
                      </button>
                    )}
                  </div>
                </div>

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
                    <span className="chart-unit">{meta.title} ({meta.axis})</span>
                  </div>
                  <div className="chart-box">
                    <p className="card-sub">The chart will go here.</p>
                  </div>
                </div>

                <div className="card">
                  <MetricPicker value={metric} onChange={setMetric} />
                </div>
              </div>
            </section>

            <section className="section" aria-labelledby="table-title">
              <div className="section-head">
                <div>
                  <h2 id="table-title">How it ranks</h2>
                  <p>Top 3 models by sustainability score, plus the model you're viewing.</p>
                </div>
                <button className="btn btn-outline" type="button" onClick={() => exportCsv(models)}>
                  <Download className="icon icon-sm" />Export data
                </button>
              </div>

              <ModelTable
                models={tableModels}
                selectedId={model.id}
                sort={sort}
                onSort={handleSort}
                showRank
              />

              <Link className="btn btn-primary btn-block" to="/rankings" style={{ marginTop: 12 }}>
                View full rankings<ArrowRight className="icon icon-sm" />
              </Link>
            </section>

            <section className="section" aria-labelledby="tips-title">
              <div className="section-head">
                <h2 id="tips-title">Sustainable AI prompt tips</h2>
              </div>
              <TipsElement tips={tips} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}