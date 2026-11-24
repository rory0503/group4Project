import { useState } from "react";
import {
  DEFAULT_TOKEN_SCALE_ID,
  TOKEN_SCALES,
} from "../lib/tokenScale";

import { Download } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import useModels from "../hooks/useModels";
import { byId, sortModels } from "../lib/helpers";
import exportCsv from "../lib/exportCsv";
import ModelPicker from "../components/ModelPicker";
import CycleModelTable from "../components/RankingsComponents/cycleRankings.jsx";
import "../styles/rankings.css";
import ModelFilterToggle from "../components/ModelFilterToggle";


export default function Rankings() {
  const { models, allModels, showAll, setShowAll, loading, error } = useModels();
  const [sort, setSort] = useState({ key: "score", dir: "desc" });
  const [primaryId, setPrimaryId] = useLocalStorage("selected", "");
  const [secondId, setSecondId] = useState(null);
  const [metric, setMetric] = useState("water");
  const [tokenScaleId, setTokenScaleId] = useState(
    DEFAULT_TOKEN_SCALE_ID
  );

  const model = byId(models, primaryId) ?? models[0];

  // Clicking the same heading flips the direction.
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

  // Full list of models in the current sort order.
  const tableModels = sortModels(models, sort.key, sort.dir);

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>AI Model Expenditure Ranking</h1>
            <p>Every tracked model ranked by sustainability score.</p>
          </div>
        </div>

        {model && (
          <section className="section" aria-labelledby="table-title">
		<ModelFilterToggle showAll={showAll} setShowAll={setShowAll} shown={models.length} total={allModels.length}/>
            <div className="section-head">

              {/* Model selection */}
              <ModelPicker
                models={models}
                value={model.id}
                onChange={setPrimaryId}
                label="Model"
                exclude={secondId ? [secondId] : []}
              />

              {/* Token scale selection */}
              <div className="field">
                <label className="label" htmlFor="rankings-token-scale">
                  Token scale
                </label>

                <select
                  className="select"
                  id="rankings-token-scale"
                  value={tokenScaleId}
                  onChange={(e) => setTokenScaleId(e.target.value)}
                >
                  {TOKEN_SCALES.map((scale) => (
                    <option key={scale.id} value={scale.id}>
                      {scale.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export button */}
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  exportCsv(
                    models,
                    "green-ai-tracker-rankings.csv",
                    tokenScaleId
                  )
                }
              >
                <Download className="icon icon-sm" />
                Export data
              </button>
            </div>

            {/* Rankings table with pagination */}
            <CycleModelTable
              key={`${sort.key}-${sort.dir}`}
              models={tableModels}
              selectedId={model.id}
              sort={sort}
              onSort={handleSort}
              tokenScaleId={tokenScaleId}
            />
          </section>
        )}
      </div>
    </main>
  );
}