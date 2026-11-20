import { useState } from "react";
import { Download } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import useModels from "../hooks/useModels";
import { byId, sortModels } from "../lib/helpers";
import exportCsv from "../lib/exportCsv";
import ModelPicker from "../components/ModelPicker";
import CycleModelTable from "../components/RankingsComponents/cycleRankings.jsx";
import { T } from "../context/TranslationContext";
import "../styles/rankings.css";

export default function Rankings() {
  const { models, loading, error } = useModels();
  const [primaryId, setPrimaryId] = useLocalStorage("selected", "");
  const [secondId, setSecondId] = useState(null);
  const [metric, setMetric] = useState("water");
  const [sort, setSort] = useState({ key: "score", dir: "desc" });

  const model = byId(models, primaryId) ?? models[0];

  function handleSort(key) {
    setSort((s) => ({
      key,
      dir:
        s.key === key
          ? s.dir === "asc" ? "desc" : "asc"
          : key === "score" ? "desc" : "asc",
    }));
  }

  const tableModels = sortModels(models, sort.key, sort.dir);

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1><T>AI Model Expenditure Ranking</T></h1>
            <p>
              <T>Every tracked model ranked by sustainability score.</T>
            </p>
          </div>
        </div>

        {loading && (
          <p className="card"><T>Loading model data…</T></p>
        )}

        {error && (
          <div className="notice">
            <T>We couldn't load the model data. Try again in a moment.</T>
          </div>
        )}

        {!loading && !error && !model && (
          <p className="card"><T>No models are available yet.</T></p>
        )}

        {model && (
          <section className="section" aria-labelledby="table-title">
            <div className="section-head">
              <ModelPicker
                models={models}
                value={model.id}
                onChange={setPrimaryId}
                label="Model"
                exclude={secondId ? [secondId] : []}
              />

              <button
                className="btn btn-outline"
                type="button"
                onClick={() => exportCsv(models)}
              >
                <Download className="icon icon-sm" />
                <T>Export data</T>
              </button>
            </div>

            <CycleModelTable
              key={`${sort.key}-${sort.dir}`}
              models={tableModels}
              selectedId={model.id}
              sort={sort}
              onSort={handleSort}
            />
          </section>
        )}
      </div>
    </main>
  );
}
